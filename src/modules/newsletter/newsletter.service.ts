import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import { Subscriber } from './entities/subscriber.entity';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { SubscribeDto } from './dto/subscribe.dto';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/send-campaign.dto';
import { getNewsletterEmailHtml } from './templates/newsletter-email';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly frontendUrl: string;
  private resend: Resend | null = null;

  constructor(
    @InjectRepository(Subscriber)
    private subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Campaign)
    private campaignRepo: Repository<Campaign>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey && apiKey.startsWith('re_')) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY sin configurar: las campañas no se envían');
    }
    this.fromEmail =
      this.configService.get<string>('MAIL_FROM_EMAIL') || 'noreply@livi.ec';
    this.fromName = this.configService.get<string>('MAIL_FROM_NAME') || 'LIVI';
    // FRONTEND_URL puede traer varios orígenes (lista de CORS): para los
    // enlaces del correo vale el primero.
    this.frontendUrl =
      (this.configService.get<string>('FRONTEND_URL') ?? '')
        .split(',')[0]
        .trim()
        .replace(/\/+$/, '') || 'http://localhost:4321';
  }

  // ─── Subscribers ──────────────────────────────────────

  async subscribe(dto: SubscribeDto): Promise<{ message: string }> {
    const existing = await this.subscriberRepo.findOne({ where: { email: dto.email } });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.unsubscribeToken = randomBytes(32).toString('hex');
        await this.subscriberRepo.save(existing);
        return { message: 'Te has suscrito nuevamente.' };
      }
      return { message: 'Ya estás suscrito.' };
    }

    const subscriber = this.subscriberRepo.create({
      ...dto,
      unsubscribeToken: randomBytes(32).toString('hex'),
    });
    await this.subscriberRepo.save(subscriber);
    return { message: '¡Gracias por suscribirte!' };
  }

  async unsubscribe(token: string): Promise<{ message: string }> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { unsubscribeToken: token },
    });
    if (!subscriber) {
      throw new NotFoundException('Suscripción no encontrada');
    }
    subscriber.isActive = false;
    await this.subscriberRepo.save(subscriber);
    return { message: 'Has cancelado tu suscripción.' };
  }

  async findAllSubscribers(): Promise<Subscriber[]> {
    return this.subscriberRepo.find({ order: { subscribedAt: 'DESC' } });
  }

  async getSubscriberStats() {
    const total = await this.subscriberRepo.count();
    const active = await this.subscriberRepo.count({ where: { isActive: true } });
    return { total, active, inactive: total - active };
  }

  async deleteSubscriber(id: number): Promise<void> {
    await this.subscriberRepo.delete(id);
  }

  // ─── Campaigns ──────────────────────────────────────

  async findAllCampaigns(): Promise<Campaign[]> {
    return this.campaignRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findCampaignById(id: number): Promise<Campaign> {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaña no encontrada');
    return campaign;
  }

  async createCampaign(dto: CreateCampaignDto): Promise<Campaign> {
    const campaign = this.campaignRepo.create(dto);
    return this.campaignRepo.save(campaign);
  }

  async updateCampaign(id: number, dto: UpdateCampaignDto): Promise<Campaign> {
    const campaign = await this.findCampaignById(id);
    if (campaign.status === CampaignStatus.SENT) {
      throw new ConflictException('No se puede editar una campaña ya enviada');
    }
    Object.assign(campaign, dto);
    return this.campaignRepo.save(campaign);
  }

  async deleteCampaign(id: number): Promise<void> {
    await this.campaignRepo.delete(id);
  }

  async sendCampaign(id: number): Promise<Campaign> {
    const campaign = await this.findCampaignById(id);
    if (campaign.status === CampaignStatus.SENT) {
      throw new ConflictException('Esta campaña ya fue enviada');
    }

    const subscribers = await this.subscriberRepo.find({ where: { isActive: true } });
    if (subscribers.length === 0) {
      throw new ConflictException('No hay suscriptores activos');
    }

    if (!this.resend) {
      this.logger.log(`[DEV] Would send campaign "${campaign.subject}" to ${subscribers.length} subscribers`);
      campaign.status = CampaignStatus.SENT;
      campaign.recipientCount = subscribers.length;
      campaign.sentAt = new Date();
      return this.campaignRepo.save(campaign);
    }

    try {
      // Resend envía por lotes de hasta 100 correos en una sola llamada.
      const batchSize = 100;
      let sent = 0;

      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize);

        const messages = batch.map((sub) => ({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: [sub.email],
          subject: campaign.subject,
          html: getNewsletterEmailHtml({
            heading: campaign.heading,
            body: campaign.body,
            ctaText: campaign.ctaText,
            ctaUrl: campaign.ctaUrl,
            imageUrl: campaign.imageUrl,
            unsubscribeUrl: `${this.frontendUrl}/api/newsletter/unsubscribe/${sub.unsubscribeToken}`,
          }),
        }));

        const { error } = await this.resend.batch.send(messages);
        if (error) {
          throw new Error(`${error.name}: ${error.message}`);
        }
        sent += batch.length;
        this.logger.log(`Newsletter batch sent: ${sent}/${subscribers.length}`);
      }

      campaign.status = CampaignStatus.SENT;
      campaign.recipientCount = sent;
      campaign.sentAt = new Date();
      return this.campaignRepo.save(campaign);
    } catch (error) {
      this.logger.error('Failed to send campaign', error);
      campaign.status = CampaignStatus.FAILED;
      await this.campaignRepo.save(campaign);
      throw error;
    }
  }

  async previewCampaign(id: number): Promise<string> {
    const campaign = await this.findCampaignById(id);
    return getNewsletterEmailHtml({
      heading: campaign.heading,
      body: campaign.body,
      ctaText: campaign.ctaText,
      ctaUrl: campaign.ctaUrl,
      imageUrl: campaign.imageUrl,
      unsubscribeUrl: '#',
    });
  }
}
