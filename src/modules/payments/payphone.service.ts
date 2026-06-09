import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface PreparePaymentDto {
  amount: number; // total in dollars (will be converted to cents)
  clientTransactionId: string;
  reference?: string;
  email?: string;
  phoneNumber?: string;
}

export interface PayPhonePrepareResponse {
  paymentId: number;
  payWithCard: string;
  payWithPayPhone: string;
}

export interface PayPhoneConfirmResponse {
  clientTransactionId: string;
  transactionId: number;
  transactionStatus: number;
  transactionStatusName: string;
  amount: number;
  cardType?: string;
  lastDigits?: string;
  authorizationCode?: string;
  statusCode: number;
  email?: string;
  phoneNumber?: string;
}

@Injectable()
export class PayPhoneService {
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly storeId: string;
  private readonly responseUrl: string;
  private readonly cancellationUrl: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>(
      'PAYPHONE_API_URL',
      'https://pay.payphonetodoesposible.com/api',
    );
    this.token = this.configService.get<string>('PAYPHONE_TOKEN', '');
    this.storeId = this.configService.get<string>('PAYPHONE_STORE_ID', '');
    this.responseUrl = this.configService.get<string>(
      'PAYPHONE_RESPONSE_URL',
      'http://localhost:4324/orden/confirmacion',
    );
    this.cancellationUrl = this.configService.get<string>(
      'PAYPHONE_CANCELLATION_URL',
      'http://localhost:4324/checkout?cancelled=true',
    );
  }

  /**
   * Create a PayPhone payment link (Prepare)
   * Amount is in dollars, will be converted to cents for PayPhone API
   */
  async prepare(dto: PreparePaymentDto): Promise<PayPhonePrepareResponse> {
    if (!this.token) {
      throw new BadRequestException('PayPhone token is not configured');
    }

    const amountInCents = Math.round(dto.amount * 100);

    // Match exact working PayPhone Prepare payload (from anko project)
    const payload = {
      clientTransactionId: dto.clientTransactionId,
      reference: dto.reference || 'Orden NönDecants',
      amount: amountInCents,
      amountWithoutTax: amountInCents,
      responseUrl: this.responseUrl,
      storeId: this.storeId,
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('[PayPhone Prepare] URL:', `${this.apiUrl}/button/Prepare`);
      console.log('[PayPhone Prepare] Payload:', JSON.stringify(payload));
    }

    try {
      const { data } = await axios.post(
        `${this.apiUrl}/button/Prepare`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
        },
      );

      if (process.env.NODE_ENV !== 'production') {
        console.log('[PayPhone Prepare] Response:', JSON.stringify(data));
      }

      return {
        paymentId: data.paymentId,
        payWithCard: data.payWithCard,
        payWithPayPhone: data.payWithPayPhone,
      };
    } catch (error: any) {
      console.error('[PayPhone Prepare] Error status:', error.response?.status);
      console.error('[PayPhone Prepare] Error data:', JSON.stringify(error.response?.data));
      const msg = error.response?.data;
      throw new BadRequestException(`PayPhone Prepare failed: ${JSON.stringify(msg)}`);
    }
  }

  /**
   * Confirm/verify a PayPhone transaction
   */
  async confirm(
    paymentId: string,
    clientTransactionId: string,
  ): Promise<PayPhoneConfirmResponse> {
    if (!this.token) {
      throw new BadRequestException('PayPhone token is not configured');
    }

    try {
      const { data } = await axios.post(
        `${this.apiUrl}/button/V2/Confirm`,
        { id: paymentId, clientTxId: clientTransactionId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
        },
      );

      if (process.env.NODE_ENV !== 'production') {
        console.log('[PayPhone Confirm] Response:', JSON.stringify(data));
      }
      return data;
    } catch (error: any) {
      console.error('[PayPhone Confirm] Error:', JSON.stringify(error.response?.data));
      const msg =
        error.response?.data?.message ||
        error.response?.data ||
        error.message;
      throw new BadRequestException(`PayPhone Confirm failed: ${JSON.stringify(msg)}`);
    }
  }

  /**
   * Check if a transaction was approved
   */
  isApproved(status: number): boolean {
    return status === 3;
  }
}
