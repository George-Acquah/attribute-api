import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import {
  CallHandler,
  NestInterceptor,
} from '@nestjs/common/interfaces/features/nest-interceptor.interface';
import { Request } from 'express';
import { Observable } from 'rxjs/internal/Observable';
import {
  ConditionPresetKey,
  conditionPresets,
} from '../constants/permissions.constants';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';

/**
 * Interceptor that maps incoming `conditions` preset keys in body
 * to actual conditions before reaching controller.
 * Example: { preset: 'owner_self' } -> { ownerId: '${user.id}' }
 */
@Injectable()
export class ConditionPresetInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const body = req.body;
    if (body && body.conditions) {
      const presets = body.conditions as
        | ConditionPresetKey
        | ConditionPresetKey[];

      // Handle if it's a single preset string
      if (typeof presets === 'string') {
        if (!conditionPresets[presets]) {
          throw new BadRequestException(`Invalid condition preset: ${presets}`);
        }
        body.conditions = conditionPresets[presets];
      }

      // Handle if it's an array of presets
      else if (Array.isArray(presets)) {
        const invalidPresets = presets.filter((p) => !conditionPresets[p]);
        if (invalidPresets.length > 0) {
          throw new BadRequestException(
            `Invalid condition presets: ${invalidPresets.join(', ')}`,
          );
        }

        body.conditions = presets.reduce((acc, key) => {
          return {
            ...acc,
            ...conditionPresets[key],
          };
        }, {});
      }

      // If neither string nor array, it's invalid
      else {
        throw new BadRequestException(
          `Invalid format for conditions. Expected string or array of strings.`,
        );
      }
    }
    return next.handle();
  }
}
