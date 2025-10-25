import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { RoleUtilisateur, StatutUtilisateur } from '@prisma/client';

// Mock complet d'un utilisateur, correspondant au 'select' du service
const mockUser = {
  id: '1',
  prenom: 'John',
  nom: 'Doe',
  email: 'test@test.com',
  telephone: null,
  adresse: null,
  specialite: null,
  barreau: null,
  numeroPermis: null,
  role: RoleUtilisateur.ADMIN,
  statut: StatutUtilisateur.ACTIF,
  creeLe: new Date(),
  modifieLe: new Date(),
};

// Mock pour le résultat paginé
const mockPaginationResult = {
  data: [mockUser],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
};

// Mock pour les statistiques
const mockStats = {
  total: 10,
  actifs: 8,
  inactifs: 1,
  suspendus: 1,
  parRole: { ADMIN: 2, AVOCAT: 5, SECRETAIRE: 3 },
  recentActivity: [{ date: '2023-10-01', count: 2 }],
};

// Mock pour les performances
const mockPerformance = [
  {
    userId: '1',
    nomComplet: 'John Doe',
    role: RoleUtilisateur.AVOCAT,
    nombreDossiers: 10,
    dossiersTermines: 8,
    tauxCompletion: 80,
    chiffreAffaires: 5000,
    satisfactionMoyenne: 4.5,
    delaiMoyenTraitement: 15,
  },
];

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateProfile: jest.fn(),
    changeStatus: jest.fn(),
    remove: jest.fn(),
    bulkAction: jest.fn(),
    getStats: jest.fn(),
    getPerformance: jest.fn(),
    search: jest.fn(),
    getAvailableRoles: jest.fn(),
    getAvailableStatuses: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        motDePasse: 'password123',
        prenom: 'John',
        nom: 'Doe',
        role: RoleUtilisateur.ADMIN,
      };
      service.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of users', async () => {
      const filters: FilterUsersDto = { role: RoleUtilisateur.ADMIN };
      const expectedParams = {
        page: 1,
        limit: 10,
        sortBy: 'creeLe',
        sortOrder: 'desc',
        ...filters,
      };
      service.findAll.mockResolvedValue(mockPaginationResult);

      const result = await controller.findAll(1, 10, 'creeLe', 'desc', filters);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAll).toHaveBeenCalledWith(expectedParams);
      expect(result).toEqual(mockPaginationResult);
    });
  });

  describe('search', () => {
    it('should return search results for users', async () => {
      service.search.mockResolvedValue([mockUser]);

      const result = await controller.search('john', 10);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.search).toHaveBeenCalledWith('john', 10);
      expect(result).toEqual([mockUser]);
    });

    it('should use default limit when not provided', async () => {
      service.search.mockResolvedValue([mockUser]);

      const result = await controller.search('john', 10);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.search).toHaveBeenCalledWith('john', 10);
      expect(result).toEqual([mockUser]);
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      service.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('getPerformance', () => {
    it('should return user performance metrics', async () => {
      service.getPerformance.mockResolvedValue(mockPerformance);

      const result = await controller.getPerformance();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getPerformance).toHaveBeenCalled();
      expect(result).toEqual(mockPerformance);
    });
  });

  describe('getAvailableRoles', () => {
    it('should return a list of available roles', () => {
      const roles = Object.values(RoleUtilisateur).map((role) => ({
        value: role,
        label: role,
      }));
      service.getAvailableRoles.mockReturnValue(roles);

      const result = controller.getAvailableRoles();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getAvailableRoles).toHaveBeenCalled();
      expect(result).toEqual(roles);
      expect(result.some((r) => r.value === RoleUtilisateur.ADMIN)).toBe(true);
    });
  });

  describe('getAvailableStatuses', () => {
    it('should return a list of available statuses', () => {
      const statuses = Object.values(StatutUtilisateur).map((statut) => ({
        value: statut,
        label: statut,
      }));
      service.getAvailableStatuses.mockReturnValue(statuses);

      const result = controller.getAvailableStatuses();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getAvailableStatuses).toHaveBeenCalled();
      expect(result).toEqual(statuses);
      expect(result.some((s) => s.value === StatutUtilisateur.ACTIF)).toBe(
        true,
      );
    });
  });

  describe('getCurrentUserProfile', () => {
    it('should return the current user profile', async () => {
      service.findOne.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUserProfile('1');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateCurrentUserProfile', () => {
    it('should update the profile of the current user', async () => {
      const updateProfileDto: UpdateProfileDto = { prenom: 'Jane' };
      const updatedUser = { ...mockUser, prenom: 'Jane' };
      service.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateCurrentUserProfile(
        '1',
        updateProfileDto,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.updateProfile).toHaveBeenCalledWith('1', updateProfileDto);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('findOne', () => {
    it('should return a single user by ID', async () => {
      service.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('1');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = { prenom: 'Jane' };
      const updatedUser = { ...mockUser, prenom: 'Jane' };
      service.update.mockResolvedValue(updatedUser);

      const result = await controller.update('1', updateUserDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.update).toHaveBeenCalledWith('1', updateUserDto);
      expect(result.prenom).toBe('Jane');
    });
  });

  describe('changeStatus', () => {
    it('should change the status of a user', async () => {
      const changeStatusDto: ChangeStatusDto = {
        statut: StatutUtilisateur.INACTIF,
        raison: 'Test',
      };
      const updatedUser = { ...mockUser, statut: StatutUtilisateur.INACTIF };
      service.changeStatus.mockResolvedValue(updatedUser);

      const result = await controller.changeStatus('1', changeStatusDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.changeStatus).toHaveBeenCalledWith('1', changeStatusDto);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('bulkAction', () => {
    it('should perform a bulk action on users', async () => {
      const bulkActionDto: BulkActionDto = {
        userIds: ['1', '2'],
        action: 'changeRole',
        role: RoleUtilisateur.SECRETAIRE,
      };
      const response = {
        message: '2 utilisateurs mis à jour avec le rôle SECRETAIRE',
        count: 2,
      };
      service.bulkAction.mockResolvedValue(response);

      const result = await controller.bulkAction(bulkActionDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.bulkAction).toHaveBeenCalledWith(bulkActionDto);
      expect(result).toEqual(response);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const response = {
        message: 'Utilisateur supprimé avec succès',
        user: {
          id: mockUser.id,
          prenom: mockUser.prenom,
          nom: mockUser.nom,
          email: mockUser.email,
          statut: mockUser.statut,
        },
      };
      service.remove.mockResolvedValue(response);

      const result = await controller.remove('1');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.remove).toHaveBeenCalledWith('1');
      expect(result).toEqual(response);
      expect(result.user.id).toBe('1');
    });
  });
});
