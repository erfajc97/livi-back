import { ProductsService } from './products.service';
import { Category } from '../categories/entities/category.entity';
import { Marca } from '../categories/entities/marca.entity';

/* ── TDD: importación masiva (plantilla Excel del admin) ─────────────────
   Verifica que bulkCreate persiste el modelo editorial LIVI completo:
   variantes color×talla (colorHex + size), usos comunes, tallas,
   combina-con (pairsWith) e Instagram — y que una fila mala no detiene
   el lote.                                                                 */

describe('ProductsService.bulkCreate (importación Excel)', () => {
  let service: ProductsService;
  let productsRepository: any;
  let variationsRepository: any;
  let categoryRepository: any;
  let marcaRepository: any;
  let dataSource: any;

  const FULL_ROW: any = {
    name: 'Noé Leather Backpack',
    price: 129,
    category: 'Mochilas',
    marca: 'LIVI',
    cost: 70,
    stock: 10,
    description: 'Mochila pañalera premium',
    isActive: true,
    detailDescription: 'Cuero vacuno genuino premium…',
    benefits: '["Cuero genuino","Hecho a mano"]',
    commonUses: '["Pañalera","Bolso de trabajo"]',
    sizes: '["Mini","Midi","Full"]',
    pairsWith: '[3,5]',
    instagramPosts: '[{"url":"https://instagram.com/p/AAA","image":"https://img/1.jpg"}]',
    variants: [
      { name: 'Negro', colorHex: '#12100E', size: 'Midi', price: 129 },
      { name: 'Negro', colorHex: '#12100E', size: 'Full', price: 139 },
    ],
  };

  beforeEach(() => {
    productsRepository = {
      create: jest.fn((dto) => dto),
      save: jest.fn(async (p) => ({ id: 99, ...p })),
    };
    variationsRepository = {
      create: jest.fn((dto) => dto),
      save: jest.fn(async (rows) => rows),
    };
    categoryRepository = {
      findOne: jest.fn(async () => ({ id: 2, name: 'Mochilas' })),
    };
    marcaRepository = {
      findOne: jest.fn(async () => ({ id: 2, name: 'LIVI' })),
    };
    dataSource = {
      getRepository: jest.fn((entity: any) => {
        if (entity === Category) return categoryRepository;
        if (entity === Marca) return marcaRepository;
        throw new Error('repo inesperado');
      }),
    };

    service = new ProductsService(productsRepository, variationsRepository, dataSource);
    // findOne hace query con relaciones; lo aislamos del test unitario.
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 99 } as any);
  });

  it('crea el producto con TODOS los campos editoriales de la ficha', async () => {
    const res = await service.bulkCreate([FULL_ROW]);

    expect(res).toMatchObject({ total: 1, created: 1, failed: 0 });

    const saved = productsRepository.save.mock.calls[0][0];
    expect(saved.name).toBe('Noé Leather Backpack');
    expect(saved.price).toBe(129);
    expect(saved.categoryId).toBe(2); // resuelto por nombre
    expect(saved.marcaId).toBe(2); // resuelto por nombre
    expect(saved.detailDescription).toBe(FULL_ROW.detailDescription);
    expect(saved.commonUses).toBe(FULL_ROW.commonUses);
    expect(saved.sizes).toBe(FULL_ROW.sizes);
    expect(saved.pairsWith).toBe(FULL_ROW.pairsWith);
    expect(saved.instagramPosts).toBe(FULL_ROW.instagramPosts);
  });

  it('crea las variantes color×talla con colorHex y size', async () => {
    await service.bulkCreate([FULL_ROW]);

    const rows = variationsRepository.save.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      productId: 99,
      name: 'Negro',
      colorHex: '#12100E',
      size: 'Midi',
      price: 129,
    });
    expect(rows[1]).toMatchObject({ size: 'Full', price: 139 });
    // SKU autogenerado cuando no viene en la fila
    expect(rows[0].sku).toContain('noe-leather-backpack');
  });

  it('acepta IDs numéricos de categoría/marca sin buscar por nombre', async () => {
    const row = { ...FULL_ROW, category: undefined, marca: undefined, categoryId: 5, marcaId: 7 };
    const res = await service.bulkCreate([row]);

    expect(res.created).toBe(1);
    expect(categoryRepository.findOne).not.toHaveBeenCalled();
    expect(marcaRepository.findOne).not.toHaveBeenCalled();
    const saved = productsRepository.save.mock.calls[0][0];
    expect(saved.categoryId).toBe(5);
    expect(saved.marcaId).toBe(7);
  });

  it('una fila incompleta falla pero NO detiene el lote', async () => {
    const badRow: any = { name: '', price: null }; // sin nombre/precio/categoría/marca
    const res = await service.bulkCreate([badRow, FULL_ROW]);

    expect(res.total).toBe(2);
    expect(res.created).toBe(1);
    expect(res.failed).toBe(1);

    const [bad, good] = res.results;
    expect(bad.success).toBe(false);
    expect(bad.row).toBe(2); // fila 1 = encabezados de la plantilla
    expect(bad.error).toContain('nombre');
    expect(good.success).toBe(true);
    expect(good.row).toBe(3);
  });

  it('reporta error claro cuando la categoría por nombre no existe', async () => {
    categoryRepository.findOne.mockResolvedValueOnce(null);
    const res = await service.bulkCreate([FULL_ROW]);

    expect(res.failed).toBe(1);
    expect(res.results[0].error).toContain('Mochilas');
    expect(res.results[0].error).toContain('no existe');
  });

  it('reporta error claro cuando la marca por nombre no existe', async () => {
    marcaRepository.findOne.mockResolvedValueOnce(null);
    const res = await service.bulkCreate([FULL_ROW]);

    expect(res.failed).toBe(1);
    expect(res.results[0].error).toContain('LIVI');
    expect(res.results[0].error).toContain('no existe');
  });

  it('sin variantes en la fila no toca la tabla de variaciones', async () => {
    const { variants, ...row } = FULL_ROW;
    const res = await service.bulkCreate([row]);

    expect(res.created).toBe(1);
    expect(variationsRepository.save).not.toHaveBeenCalled();
  });
});
