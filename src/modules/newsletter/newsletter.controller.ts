import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { Public } from '../../common/decorators/public.decorator';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/send-campaign.dto';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  // ─── Public endpoints ────────────────────────────────

  @Post('subscribe')
  @Public()
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletterService.subscribe(dto);
  }

  @Get('unsubscribe/:token')
  @Public()
  @ApiOperation({ summary: 'Unsubscribe from newsletter' })
  unsubscribe(@Param('token') token: string) {
    return this.newsletterService.unsubscribe(token);
  }

  // ─── Admin: Subscribers ──────────────────────────────

  @Get('subscribers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all subscribers (admin)' })
  findAllSubscribers() {
    return this.newsletterService.findAllSubscribers();
  }

  @Get('subscribers/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get subscriber stats' })
  getStats() {
    return this.newsletterService.getSubscriberStats();
  }

  @Delete('subscribers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete subscriber' })
  deleteSubscriber(@Param('id', ParseIntPipe) id: number) {
    return this.newsletterService.deleteSubscriber(id);
  }

  // ─── Admin: Campaigns ────────────────────────────────

  @Get('campaigns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all campaigns' })
  findAllCampaigns() {
    return this.newsletterService.findAllCampaigns();
  }

  @Get('campaigns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get campaign by id' })
  findCampaign(@Param('id', ParseIntPipe) id: number) {
    return this.newsletterService.findCampaignById(id);
  }

  @Post('campaigns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create campaign draft' })
  createCampaign(@Body() dto: CreateCampaignDto) {
    return this.newsletterService.createCampaign(dto);
  }

  @Patch('campaigns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update campaign draft' })
  updateCampaign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.newsletterService.updateCampaign(id, dto);
  }

  @Delete('campaigns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete campaign' })
  deleteCampaign(@Param('id', ParseIntPipe) id: number) {
    return this.newsletterService.deleteCampaign(id);
  }

  @Post('campaigns/:id/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Send campaign to all active subscribers' })
  sendCampaign(@Param('id', ParseIntPipe) id: number) {
    return this.newsletterService.sendCampaign(id);
  }

  @Get('campaigns/:id/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Preview campaign email HTML' })
  previewCampaign(@Param('id', ParseIntPipe) id: number) {
    return this.newsletterService.previewCampaign(id);
  }
}
