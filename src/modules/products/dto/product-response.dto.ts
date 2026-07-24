import { ApiProperty } from '@nestjs/swagger';
import { Gender, TimeOfDay, Concentration, Projection } from '../entities/product.entity';
import { ProductVariationResponseDto } from './product-variation-response.dto';
import { ProductImageResponseDto } from './product-image-response.dto';
import { ProductVideoResponseDto } from './product-video-response.dto';

export class ProductResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ description: 'Unit acquisition cost (admin)' })
  cost: number;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  imageUrl?: string;

  @ApiProperty({ description: 'Sealed bottles in stock' })
  stock: number;

  @ApiProperty({ description: 'Total ml per bottle' })
  totalMl: number;

  @ApiProperty({ description: 'Remaining ml in currently open bottle' })
  openBottleMlRemaining: number;

  @ApiProperty({ description: 'Total available ml (open bottle + sealed stock)' })
  availableMl: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  bajoPedido: boolean;

  @ApiProperty({ required: false })
  gender?: Gender;

  @ApiProperty({ required: false })
  timeOfDay?: TimeOfDay;

  @ApiProperty({ required: false })
  concentration?: Concentration;

  @ApiProperty({ required: false })
  projection?: Projection;

  @ApiProperty({ required: false })
  discount?: number;

  @ApiProperty({ required: false })
  detailDescription?: string;

  @ApiProperty({ required: false })
  benefits?: string;

  // ── PDP editorial ──
  @ApiProperty({ required: false })
  scentProfileTitle?: string;

  @ApiProperty({ required: false })
  scentSections?: Array<{ title: string; notes: Array<{ name: string; color: string }>; description: string }>;

  @ApiProperty({ required: false })
  mood?: string[];

  @ApiProperty({ required: false })
  occasion?: string[];

  @ApiProperty({ required: false })
  longevity?: number;

  @ApiProperty({ required: false })
  projectionScore?: number;

  @ApiProperty({ required: false })
  signatureTitle?: string;

  @ApiProperty({ required: false })
  signatureDescription?: string;

  @ApiProperty({ required: false })
  signatureImageUrl?: string;

  @ApiProperty()
  salesCount: number;

  @ApiProperty()
  categoryId: number;

  @ApiProperty()
  marcaId: number;

  @ApiProperty({ description: 'Number of active purchasable formats (bottle + decants)' })
  variationsCount: number;

  @ApiProperty({ type: [ProductVariationResponseDto], required: false })
  variations?: ProductVariationResponseDto[];

  @ApiProperty({ type: [ProductImageResponseDto], required: false })
  images?: ProductImageResponseDto[];

  @ApiProperty({ type: [ProductVideoResponseDto], required: false })
  videos?: ProductVideoResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(product: any, includeVariations: boolean = false) {
    this.id = product.id;
    this.name = product.name;
    this.price = Number(product.price);
    this.cost = Number(product.cost ?? 0);
    this.description = product.description;
    this.imageUrl = product.imageUrl;
    this.stock = product.stock;
    this.totalMl = Number(product.totalMl || 0);
    this.openBottleMlRemaining = Number(product.openBottleMlRemaining || 0);
    this.availableMl =
      this.openBottleMlRemaining + this.stock * this.totalMl;
    this.isActive = product.isActive;
    this.bajoPedido = product.bajoPedido;
    this.gender = product.gender;
    this.timeOfDay = product.timeOfDay;
    this.concentration = product.concentration;
    this.projection = product.projection;
    this.discount = product.discount;
    this.detailDescription = product.detailDescription;
    this.benefits = product.benefits;
    this.scentProfileTitle = product.scentProfileTitle ?? undefined;
    this.scentSections = product.scentSections ?? undefined;
    this.mood = product.mood ?? undefined;
    this.occasion = product.occasion ?? undefined;
    this.longevity = product.longevity ?? undefined;
    this.projectionScore = product.projectionScore ?? undefined;
    this.signatureTitle = product.signatureTitle ?? undefined;
    this.signatureDescription = product.signatureDescription ?? undefined;
    this.signatureImageUrl = product.signatureImageUrl ?? undefined;
    this.salesCount = product.salesCount ?? 0;
    this.categoryId = product.categoryId;
    this.marcaId = product.marcaId;
    // Conteo de formatos: usa el count del list (loadRelationCountAndMap) o,
    // en el detalle, la longitud de las variaciones cargadas.
    this.variationsCount =
      product.variationsCount ?? (product.variations?.length ?? 0);
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;

    if (includeVariations && product.variations && product.variations.length > 0) {
      this.variations = product.variations.map(
        (variation: any) => new ProductVariationResponseDto(variation, this.stock, this.totalMl, this.openBottleMlRemaining),
      );
    }

    if (product.images && product.images.length > 0) {
      this.images = product.images.map((image: any) => new ProductImageResponseDto(image));
    }

    if (product.videos && product.videos.length > 0) {
      this.videos = product.videos.map((video: any) => new ProductVideoResponseDto(video));
    }
  }
}
