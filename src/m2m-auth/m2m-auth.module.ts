import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { M2MAuthStrategy } from './m2m-auth.guard';
import { M2M_AUTH_TOKEN } from './m2m-auth.const';
import { M2MAuthModuleOptions } from './m2m-auth.interface';

@Module({})
export class M2MAuthModule {
  static register(options: M2MAuthModuleOptions): DynamicModule {
    return {
      module: M2MAuthModule,
      providers: [
        {
          provide: M2M_AUTH_TOKEN,
          useValue: options.authToken,
        },
        M2MAuthStrategy,
      ],
      exports: [M2MAuthStrategy],
    };
  }

  static forRoot(): DynamicModule {
    return {
      module: M2MAuthModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: M2M_AUTH_TOKEN,
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            return configService.get<string>('m2mAuth.token');
          },
        },
        M2MAuthStrategy,
      ],
      exports: [M2MAuthStrategy],
    };
  }
}
