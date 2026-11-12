import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartDto } from '../../application/dto/cart.dto';
import { QuoteCartUseCase } from '../../application/use-cases/quote-cart.use-case';

@ApiTags('Carrito')
@Controller({ path: 'cart', version: '1' })
export class CartController {
  constructor(private readonly quoteCart: QuoteCartUseCase) {}

  @Post('quote')
  @HttpCode(200)
  @ApiOperation({ summary: 'Recalcula el carrito con precios y stock reales; marca líneas con problemas' })
  quote(@Body() dto: CartDto) {
    return this.quoteCart.execute(dto.items);
  }
}
