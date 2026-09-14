import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from './entities/blog-post.entity';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private blogRepository: Repository<BlogPost>,
    private cloudinaryService: CloudinaryService,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(
    dto: CreateBlogPostDto,
    file?: Express.Multer.File,
  ): Promise<BlogPost> {
    if (!dto.slug) {
      dto.slug = this.generateSlug(dto.title);
    }

    const existing = await this.blogRepository.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`A blog post with slug "${dto.slug}" already exists`);
    }

    if (file) {
      const uploaded = await this.cloudinaryService.uploadFile(file, 'blog');
      dto.imageUrl = uploaded.url;
      dto.imageKey = uploaded.key;
    }

    const post = this.blogRepository.create(dto);
    if (dto.isPublished !== false) {
      post.publishedAt = new Date();
    }
    return this.blogRepository.save(post);
  }

  async findAll(): Promise<BlogPost[]> {
    return this.blogRepository.find({
      order: { position: 'ASC', createdAt: 'DESC' },
    });
  }

  async findPublished(): Promise<BlogPost[]> {
    return this.blogRepository.find({
      where: { isPublished: true },
      order: { position: 'ASC', publishedAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<BlogPost> {
    const post = await this.blogRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Blog post with ID ${id} not found`);
    }
    return post;
  }

  async findBySlug(slug: string): Promise<BlogPost> {
    const post = await this.blogRepository.findOne({ where: { slug, isPublished: true } });
    if (!post) {
      throw new NotFoundException(`Blog post "${slug}" not found`);
    }
    return post;
  }

  async update(
    id: number,
    dto: UpdateBlogPostDto,
    file?: Express.Multer.File,
  ): Promise<BlogPost> {
    const post = await this.findOne(id);

    if (file) {
      if (post.imageKey) {
        await this.cloudinaryService.deleteFile(post.imageKey);
      }
      const uploaded = await this.cloudinaryService.uploadFile(file, 'blog');
      dto.imageUrl = uploaded.url;
      dto.imageKey = uploaded.key;
    }

    if (dto.isPublished === true && !post.publishedAt) {
      (post as any).publishedAt = new Date();
    }

    Object.assign(post, dto);
    return this.blogRepository.save(post);
  }

  async remove(id: number): Promise<void> {
    const post = await this.findOne(id);
    if (post.imageKey) {
      await this.cloudinaryService.deleteFile(post.imageKey);
    }
    await this.blogRepository.remove(post);
  }

  async reorder(orderedIds: number[]): Promise<void> {
    const updates = orderedIds.map((id, index) =>
      this.blogRepository.update(id, { position: index }),
    );
    await Promise.all(updates);
  }
}
