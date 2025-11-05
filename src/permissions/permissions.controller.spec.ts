import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { RoleUtilisateur } from '@prisma/client';

describe('PermissionsController', () => {
  let controller: PermissionsController;

  const mockService = {
    getAllRoles: jest.fn().mockReturnValue(Object.values(RoleUtilisateur)),
    getPermissionsByRole: jest.fn(),
    upsertPermissions: jest.fn(),
    updatePermission: jest.fn(),
    deletePermission: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        {
          provide: PermissionsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PermissionsController>(PermissionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all roles', () => {
    expect(controller.getRoles()).toEqual(Object.values(RoleUtilisateur));
  });

  it('should call getPermissionsByRole', async () => {
    const mockPerms = [
      { module: 'TEST', lecture: true, ecriture: false, suppression: false },
    ];
    mockService.getPermissionsByRole.mockResolvedValue(mockPerms);

    const result = await controller.getPermissions(RoleUtilisateur.ADMIN);

    expect(result).toEqual(mockPerms);
    expect(mockService.getPermissionsByRole).toHaveBeenCalledWith(
      RoleUtilisateur.ADMIN,
    );
  });

  it('should call upsertPermissions', async () => {
    const dto = {
      permissions: [
        { module: 'TEST', lecture: true, ecriture: true, suppression: false },
      ],
    };

    mockService.upsertPermissions.mockResolvedValue(dto.permissions);

    const result = await controller.upsert(RoleUtilisateur.ADMIN, dto);

    expect(result).toEqual(dto.permissions);
    expect(mockService.upsertPermissions).toHaveBeenCalledWith(
      RoleUtilisateur.ADMIN,
      dto,
    );
  });

  it('should call updatePermission', async () => {
    const dto = { lecture: false };

    mockService.updatePermission.mockResolvedValue(dto);

    const result = await controller.update(RoleUtilisateur.ADMIN, 'TEST', dto);

    expect(result).toEqual(dto);
    expect(mockService.updatePermission).toHaveBeenCalledWith(
      RoleUtilisateur.ADMIN,
      'TEST',
      dto,
    );
  });

  it('should call deletePermission', async () => {
    const mockResult = {
      message: 'Permission supprimée',
      permission: { module: 'TEST' },
    };

    mockService.deletePermission.mockResolvedValue(mockResult);

    const result = await controller.remove(RoleUtilisateur.ADMIN, 'TEST');

    expect(result).toEqual(mockResult);
    expect(mockService.deletePermission).toHaveBeenCalledWith(
      RoleUtilisateur.ADMIN,
      'TEST',
    );
  });
});
