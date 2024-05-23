import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SESClient,
  SESClientConfig,
  CreateTemplateCommand,
  GetTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
  ListTemplatesCommand,
  SendBulkTemplatedEmailCommand,
  SendTemplatedEmailCommand,
  SendTemplatedEmailCommandInput,
} from '@aws-sdk/client-ses';

import {
  SendBulkEmailInput,
  TemplateData,
  ListTemplateOptions,
  ListTemplateResultSet,
  DeleteTemplateResultSet,
  SendBulkEmailRes,
  SendEmailInput,
} from './ses.interface';

@Injectable()
export class SesService {
  private readonly client: SESClient;

  private readonly senderEmail: string;

  private readonly configurationName: string;

  constructor(private readonly config: ConfigService) {
    this.senderEmail = this.config.get<string>('SENDER_EMAIL');
    this.configurationName = this.config.get<string>('CONFIGURATION_NAME');
    const region = this.config.get<string>('AWS_REGION');
    const sesConfig: SESClientConfig = { region };

    this.client = new SESClient(sesConfig);
  }

  public async createTemplate(template: TemplateData): Promise<void> {
    const command = new CreateTemplateCommand({
      Template: {
        TemplateName: template.name,
        SubjectPart: template.subject,
        ...(template.html && { HtmlPart: template.html }),
        ...(template.text && { TextPart: template.text }),
      },
    });

    await this.client.send(command);
  }

  public async getTemplate(name: string): Promise<TemplateData> {
    const command = new GetTemplateCommand({ TemplateName: name });
    const { Template } = await this.client.send(command);

    if (!Template || !Template.TemplateName) {
      throw new Error(`Template ${name} does not exist.`);
    }

    return {
      name: Template.TemplateName,
      subject: Template.SubjectPart || '',
      ...(Template.HtmlPart && { html: Template.HtmlPart }),
      ...(Template.TextPart && { text: Template.TextPart }),
    };
  }

  public async updateTemplate(template: TemplateData): Promise<void> {
    const command = new UpdateTemplateCommand({
      Template: {
        TemplateName: template.name,
        SubjectPart: template.subject,
        ...(template.html && { HtmlPart: template.html }),
        ...(template.text && { TextPart: template.text }),
      },
    });

    await this.client.send(command);
  }

  public async deleteTemplate(
    names: string | string[],
  ): Promise<DeleteTemplateResultSet> {
    const success: string[] = [];
    const failed: string[] = [];

    let templateNames: string[];

    if (Array.isArray(names)) {
      templateNames = names;
    } else {
      templateNames = [names];
    }

    await Promise.all(
      templateNames.map(async (name) => {
        try {
          const command = new DeleteTemplateCommand({ TemplateName: name });

          await this.client.send(command);
          success.push(name);
        } catch (err) {
          failed.push(name);
        }
      }),
    );

    return { success, failed };
  }

  public async listTemplates(
    options?: ListTemplateOptions,
  ): Promise<ListTemplateResultSet> {
    const { limit, offset } = options || {};

    const params = {
      ...(limit && { MaxItems: limit }),
      ...(offset && { NextToken: offset.split(' ').join('+') }),
    };
    const command = new ListTemplatesCommand(params);

    const { NextToken, TemplatesMetadata } = await this.client.send(command);

    return {
      ...(NextToken && { offset: NextToken }),
      items: (TemplatesMetadata || []).map((template) => ({
        name: template.Name || '',
        creationDate: template.CreatedTimestamp || new Date(),
      })),
    };
  }

  public async sendTemplatedEmail(
    name: string,
    emailInput: SendEmailInput,
  ): Promise<void> {
    const { senderEmail, receiver, replyTo, configurationName } = emailInput;

    const Source = senderEmail || this.senderEmail;
    const configName = configurationName || this.configurationName;

    const defaultTemplateData = JSON.stringify({});
    const params: SendTemplatedEmailCommandInput = {
      Source,
      Template: name,
      Destination: { ToAddresses: [receiver.email] },
      TemplateData: defaultTemplateData,
      ...(replyTo && replyTo.length && { ReplyToAddresses: replyTo }),
      ...(configName && { ConfigurationSetName: configName }),
    };

    const command = new SendTemplatedEmailCommand(params);

    await this.client.send(command);
  }

  public async sendBulkTemplatedEmail(
    name: string,
    sendBulkEmailInput: SendBulkEmailInput,
  ): Promise<SendBulkEmailRes[]> {
    const { senderEmail, receivers, replyTo, configurationName } =
      sendBulkEmailInput;

    const Source = senderEmail || this.senderEmail;
    const configName = configurationName || this.configurationName;

    const defaultTemplateData = JSON.stringify({});

    const Destinations = receivers.map((receiver) => ({
      Destination: {
        ToAddresses: [receiver.email],
        ...(receiver.toCC && { CcAddresses: receiver.toCC }),
        ...(receiver.toBCC && { BccAddresses: receiver.toBCC }),
      },
      ReplacementTemplateData: receiver.data
        ? JSON.stringify(receiver.data)
        : defaultTemplateData,
    }));

    const params = {
      Source,
      Template: name,
      Destinations,
      DefaultTemplateData: defaultTemplateData,
      ...(replyTo && replyTo.length && { ReplyToAddresses: replyTo }),
      ...(configName && { ConfigurationSetName: configName }),
    };

    const command = new SendBulkTemplatedEmailCommand(params);

    const { Status } = await this.client.send(command);

    if (!Status) {
      throw new Error(`Status is not defined`);
    }

    const bulkEmailRes: SendBulkEmailRes[] = [];

    Status.forEach((status) => {
      if (status.MessageId && status.Status) {
        bulkEmailRes.push({
          status: status.Status,
          messageId: status.MessageId,
          ...(status.Error && { errorMsg: status.Error }),
        });
      }
    });

    return bulkEmailRes;
  }
}
