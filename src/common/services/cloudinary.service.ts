import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

/**
 * CloudinaryService — reemplazo drop-in del antiguo S3Service.
 *
 * Misma interfaz pública (uploadFile / uploadFiles / deleteFile / deleteFiles)
 * y mismo contrato de retorno `{ url, key }`, donde:
 *   - `url` = secure_url pública de Cloudinary
 *   - `key` = public_id de Cloudinary (se guarda en la DB igual que antes el S3 key)
 *
 * Credenciales por variables de entorno:
 *   CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
 * (o la URL completa CLOUDINARY_URL, que el SDK lee solo).
 *
 * Las carpetas quedan namespaced bajo `livi/` para no mezclar entornos.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly rootFolder: string;
  private readonly configured: boolean;

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME', '');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY', '');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET', '');

    // Un placeholder tipo CAMBIAR_... no es una credencial: sin este filtro
    // Cloudinary respondía 401 y la subida fallaba con un mensaje opaco.
    const isPlaceholder = (v: string) => /^(cambiar|pegar|tu_|your_|xxx)/i.test(v.trim());
    const complete = Boolean(cloudName && apiKey && apiSecret);
    this.configured =
      complete && ![cloudName, apiKey, apiSecret].some(isPlaceholder);
    this.rootFolder = this.configService.get<string>('CLOUDINARY_FOLDER', 'livi');

    if (this.configured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    } else {
      // No lanzamos error: permite levantar la API en local sin cuenta aún.
      // Fallará solo cuando se intente subir/borrar un archivo.
      this.logger.warn(
        `Cloudinary NO configurado (${complete ? 'las credenciales siguen siendo valores de ejemplo' : 'faltan CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET'}). ` +
          'Las subidas de archivos fallarán hasta completar las credenciales.',
      );
    }
  }

  /** Sube un archivo (imagen, video o pdf) a Cloudinary. */
  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    allowedMimeTypes?: string[],
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }
    this.assertConfigured();

    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'bin';
    const publicId = `${this.rootFolder}/${folder}/${uuidv4()}`;
    const resourceType = this.resourceTypeFor(file.mimetype, extension);

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            resource_type: resourceType,
            // `auto` ya negocia el formato; para raw hay que conservar la extensión.
            ...(resourceType === 'raw' ? { public_id: `${publicId}.${extension}` } : {}),
          },
          (error, res) => (error || !res ? reject(error ?? new Error('Upload failed')) : resolve(res)),
        );
        stream.end(file.buffer);
      });

      return { url: result.secure_url, key: result.public_id };
    } catch (error: any) {
      throw new BadRequestException(`Failed to upload file to Cloudinary: ${error?.message ?? error}`);
    }
  }

  /** Sube varios archivos en paralelo. */
  async uploadFiles(
    files: Express.Multer.File[],
    folder: string,
    allowedMimeTypes?: string[],
  ): Promise<{ url: string; key: string }[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    return Promise.all(files.map((file) => this.uploadFile(file, folder, allowedMimeTypes)));
  }

  /** Borra un archivo por su public_id (el `key` guardado en la DB). */
  async deleteFile(key: string): Promise<void> {
    if (!key) {
      throw new BadRequestException('File key is required');
    }
    this.assertConfigured();

    // El resource_type no se puede inferir con certeza del public_id:
    // intentamos image → video → raw hasta que uno responda "ok".
    const attempts: Array<'image' | 'video' | 'raw'> = ['image', 'video', 'raw'];
    let lastError: any = null;
    for (const type of attempts) {
      try {
        const res = await cloudinary.uploader.destroy(key, { resource_type: type });
        if (res?.result === 'ok' || res?.result === 'not found') return;
      } catch (error) {
        lastError = error;
      }
    }
    throw new BadRequestException(
      `Failed to delete file from Cloudinary: ${lastError?.message ?? 'unknown error'}`,
    );
  }

  /** Borra varios archivos. */
  async deleteFiles(keys: string[]): Promise<void> {
    if (!keys || keys.length === 0) return;
    await Promise.all(keys.map((key) => this.deleteFile(key)));
  }

  private assertConfigured(): void {
    if (!this.configured) {
      throw new BadRequestException(
        'Cloudinary no está configurado: revisa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET (no pueden quedar con los valores de ejemplo CAMBIAR_...)',
      );
    }
  }

  private resourceTypeFor(mimetype: string, extension: string): 'image' | 'video' | 'raw' {
    if (mimetype?.startsWith('image/')) return 'image';
    if (mimetype?.startsWith('video/')) return 'video';
    if (mimetype === 'application/pdf') return 'raw';
    // Fallback por extensión (multer a veces trae application/octet-stream)
    if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg'].includes(extension)) return 'image';
    if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(extension)) return 'video';
    return 'raw';
  }
}
