import { sortSizes } from './product.mapper';

describe('sortSizes', () => {
  it('ordena tallas de ropa por talla y calzado por número', () => {
    expect(sortSizes(['L', '27', 'XS', '25.5', 'M', 'XS'])).toEqual(['XS', 'M', 'L', '25.5', '27']);
  });
});
