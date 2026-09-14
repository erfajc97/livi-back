import { ApiProperty } from '@nestjs/swagger';
import { ProductVariationResponseDto } from './product-variation-response.dto';
import { orderedGallery, ProductImageResponseDto } from './product-image-response.dto';
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

  @ApiProperty({ description: 'Units in stock' })
  stock: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  discount?: number;

  @ApiProperty({ required: false })
  detailDescription?: string;

  @ApiProperty({ required: false })
  benefits?: string;

  @ApiProperty({ required: false })
  commonUses?: string;

  @ApiProperty({ required: false, description: 'JSON array de IDs de productos "Combina con"' })
  pairsWith?: string;

  @ApiProperty({ required: false, description: 'JSON array de tallas disponibles' })
  sizes?: string;

  @ApiProperty({ required: false, description: 'JSON array de posts de Instagram { url, image }' })
  instagramPosts?: string;

  @ApiProperty()
  salesCount: number;

  @ApiProperty()
  categoryId: number;

  @ApiProperty()
  marcaId: number;

  @ApiProperty({ required: false })
  marca?: { id: number; name: string; slug?: string };

  @ApiProperty({ description: 'Number of active purchasable variations' })
  variationsCount: number;

  @ApiProperty({ description: 'Cheapest active variation price' })
  minFormatPrice: number;

  @ApiProperty({ description: 'Most expensive active variation price' })
  maxFormatPrice: number;

  @ApiProperty({
    required: false,
    description: 'Compact list of active variations for cards',
  })
  formats?: { id: number; name?: string; price: number; imageUrl?: string; colorHex?: string; size?: string }[];

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
    this.isActive = product.isActive;
    this.discount = product.discount;
    this.detailDescription = product.detailDescription;
    this.benefits = product.benefits;
    this.commonUses = product.commonUses;
    this.pairsWith = product.pairsWith;
    this.sizes = product.sizes;
    this.instagramPosts = product.instagramPosts;
    this.salesCount = product.salesCount ?? 0;
    this.categoryId = product.categoryId;
    this.marcaId = product.marcaId;
    this.marca = product.marca
      ? {
          id: Number(product.marca.id),
          name: product.marca.name,
          slug: product.marca.slug ?? undefined,
        }
      : undefined;
    // Conteo de variaciones: usa el count del list o, en el detalle, la
    // longitud de las variaciones cargadas.
    this.variationsCount =
      product.variationsCount ?? (product.variations?.length ?? 0);
    // Rango de precio de variaciones. En el list viene del agregado
    // (minFormatPrice/maxFormatPrice); en el detalle se deriva de las
    // variaciones cargadas; si no hay, cae al precio del producto.
    const variationPrices = (product.variations ?? [])
      .map((v: any) => Number(v.price))
      .filter((n: number) => !Number.isNaN(n));
    this.minFormatPrice =
      product.minFormatPrice != null
        ? Number(product.minFormatPrice)
        : variationPrices.length
          ? Math.min(...variationPrices)
          : Number(product.price);
    this.maxFormatPrice =
      product.maxFormatPrice != null
        ? Number(product.maxFormatPrice)
        : variationPrices.length
          ? Math.max(...variationPrices)
          : Number(product.price);
    // Lista compacta de variaciones: del list (product.formats) o derivada de
    // las variaciones cargadas en el detalle.
    this.formats =
      product.formats ??
      (product.variations?.length
        ? product.variations.map((v: any) => {
            const images = orderedGallery(v.images);
            return {
              id: Number(v.id),
              name: v.name ?? undefined,
              price: Number(v.price),
              imageUrl: images[0]?.url ?? undefined,
              colorHex: v.colorHex ?? undefined,
              size: v.size ?? undefined,
            };
          })
        : undefined);
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;

    if (includeVariations && product.variations && product.variations.length > 0) {
      this.variations = product.variations.map(
        (variation: any) => new ProductVariationResponseDto(variation, this.stock),
      );
    }

    const gallery = orderedGallery(product.images);
    if (gallery.length > 0) {
      this.images = gallery.map((image: any) => new ProductImageResponseDto(image));
      this.imageUrl = gallery[0].url ?? product.imageUrl;
    }

    if (product.videos && product.videos.length > 0) {
      this.videos = product.videos.map((video: any) => new ProductVideoResponseDto(video));
    }
  }
}
