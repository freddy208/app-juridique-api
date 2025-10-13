import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { NotFoundException } from '@nestjs/common';
import { RoleUtilisateur } from '@prisma/client';
import { PermissionsByRoleDto } from './dto/create-permissions.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

describe('PermissionsService', () => {
  let service: PermissionsService;

  // Mock du PrismaClient
  const prismaMock = {
    permissionRole: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionsService],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);

    // Injecter le mock dans la propriété privée prisma
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (service as any).prisma = prismaMock;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllRoles', () => {
    it('should return all roles', () => {
      const roles = service.getAllRoles();
      expect(roles).toContain(RoleUtilisateur.ADMIN);
      expect(roles).toContain(RoleUtilisateur.ASSISTANT);
    });
  });

  describe('getPermissionsByRole', () => {
    it('should return permissions if found', async () => {
      const mockPermissions = [
        { module: 'TEST', lecture: true, ecriture: false, suppression: false },
      ];
      prismaMock.permissionRole.findMany.mockResolvedValue(mockPermissions);

      const result = await service.getPermissionsByRole(RoleUtilisateur.ADMIN);
      expect(result).toEqual(mockPermissions);
      expect(prismaMock.permissionRole.findMany).toHaveBeenCalledWith({
        where: { role: RoleUtilisateur.ADMIN, statut: 'ACTIF' },
        select: {
          module: true,
          lecture: true,
          ecriture: true,
          suppression: true,
        },
      });
    });

    it('should throw NotFoundException if no permissions', async () => {
      prismaMock.permissionRole.findMany.mockResolvedValue([]);
      await expect(
        service.getPermissionsByRole(RoleUtilisateur.ADMIN),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('upsertPermissions', () => {
    it('should update existing permission', async () => {
      const dto: PermissionsByRoleDto = {
        permissions: [
          { module: 'TEST', lecture: false, ecriture: true, suppression: true },
        ],
      };
      const existing = {
        id: '1',
        module: 'TEST',
        role: RoleUtilisateur.ADMIN,
        lecture: true,
        ecriture: false,
        suppression: false,
        statut: 'ACTIF',
      };
      const updated = { ...existing, ...dto.permissions[0] };

      prismaMock.permissionRole.findFirst.mockResolvedValue(existing);
      prismaMock.permissionRole.update.mockResolvedValue(updated);

      const result = await service.upsertPermissions(
        RoleUtilisateur.ADMIN,
        dto,
      );
      expect(result).toEqual([updated]);
    });

    it('should create new permission if not exists', async () => {
      const dto: PermissionsByRoleDto = {
        permissions: [
          { module: 'NEW', lecture: true, ecriture: false, suppression: false },
        ],
      };
      prismaMock.permissionRole.findFirst.mockResolvedValue(null);
      prismaMock.permissionRole.create.mockResolvedValue({
        ...dto.permissions[0],
        id: '123',
        role: RoleUtilisateur.ADMIN,
        statut: 'ACTIF',
      });

      const result = await service.upsertPermissions(
        RoleUtilisateur.ADMIN,
        dto,
      );
      expect(result[0].module).toBe('NEW');
    });
  });

  describe('updatePermission', () => {
    it('should update permission fields', async () => {
      const existing = {
        id: '1',
        module: 'TEST',
        role: RoleUtilisateur.ADMIN,
        lecture: true,
        ecriture: false,
        suppression: false,
        statut: 'ACTIF',
      };
      const dto: UpdatePermissionDto = { lecture: false };

      prismaMock.permissionRole.findFirst.mockResolvedValue(existing);
      prismaMock.permissionRole.update.mockResolvedValue({
        ...existing,
        lecture: false,
      });

      const result = await service.updatePermission(
        RoleUtilisateur.ADMIN,
        'TEST',
        dto,
      );
      expect(result.lecture).toBe(false);
    });

    it('should throw NotFoundException if permission not found', async () => {
      prismaMock.permissionRole.findFirst.mockResolvedValue(null);

      await expect(
        service.updatePermission(RoleUtilisateur.ADMIN, 'TEST', {
          lecture: true,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deletePermission', () => {
    it('should soft delete permission', async () => {
      const existing = {
        id: '1',
        module: 'TEST',
        role: RoleUtilisateur.ADMIN,
        statut: 'ACTIF',
      };
      prismaMock.permissionRole.findFirst.mockResolvedValue(existing);
      prismaMock.permissionRole.update.mockResolvedValue({
        ...existing,
        statut: 'INACTIF',
      });

      const result = await service.deletePermission(
        RoleUtilisateur.ADMIN,
        'TEST',
      );
      expect(result.permission.statut).toBe('INACTIF');
    });

    it('should throw NotFoundException if permission not active', async () => {
      prismaMock.permissionRole.findFirst.mockResolvedValue(null);

      await expect(
        service.deletePermission(RoleUtilisateur.ADMIN, 'TEST'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
