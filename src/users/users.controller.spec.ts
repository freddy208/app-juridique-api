/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangerPasswordDto } from './dto/change-password.dto';
import { QueryUsersDto } from './dto/filter-users.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getAvocatsDisponibles: jest.fn(),
    findOne: jest.fn(),
    getUserStats: jest.fn(),
    getUserDossiers: jest.fn(),
    getUserTaches: jest.fn(),
    getUserEvenements: jest.fn(),
    getUserNotifications: jest.fn(),
    update: jest.fn(),
    changePassword: jest.fn(),
    markNotificationsAsRead: jest.fn(),
    remove: jest.fn(),
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
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        prenom: 'Test',
        nom: 'User',
        motDePasse: 'password123',
        role: 'AVOCAT',
      };

      const expectedResult = {
        id: 'uuid-123',
        email: 'test@example.com',
        prenom: 'Test',
        nom: 'User',
        role: 'AVOCAT',
        statut: 'ACTIF',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return a list of users', async () => {
      const query: QueryUsersDto = {
        page: 1,
        limit: 10,
        search: 'test',
        role: 'AVOCAT',
        statut: 'ACTIF',
      };

      const expectedResult = {
        data: [
          {
            id: 'uuid-123',
            email: 'test@example.com',
            prenom: 'Test',
            nom: 'User',
            role: 'AVOCAT',
            statut: 'ACTIF',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockUsersService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAvocatsDisponibles', () => {
    it('should return available lawyers', async () => {
      const dateDebut = '2023-06-01T00:00:00.000Z';
      const dateFin = '2023-06-30T23:59:59.999Z';

      const expectedResult = [
        {
          id: 'uuid-123',
          email: 'lawyer@example.com',
          prenom: 'Lawyer',
          nom: 'User',
          role: 'AVOCAT',
          statut: 'ACTIF',
        },
      ];

      mockUsersService.getAvocatsDisponibles.mockResolvedValue(expectedResult);

      const result = await controller.getAvocatsDisponibles(dateDebut, dateFin);

      expect(service.getAvocatsDisponibles).toHaveBeenCalledWith(
        new Date(dateDebut),
        new Date(dateFin),
      );
      expect(result).toEqual(expectedResult);
    });

    it('should return available lawyers without date filters', async () => {
      const expectedResult = [
        {
          id: 'uuid-123',
          email: 'lawyer@example.com',
          prenom: 'Lawyer',
          nom: 'User',
          role: 'AVOCAT',
          statut: 'ACTIF',
        },
      ];

      mockUsersService.getAvocatsDisponibles.mockResolvedValue(expectedResult);

      const result = await controller.getAvocatsDisponibles();

      expect(service.getAvocatsDisponibles).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = 'uuid-123';

      const expectedResult = {
        id: 'uuid-123',
        email: 'test@example.com',
        prenom: 'Test',
        nom: 'User',
        role: 'AVOCAT',
        statut: 'ACTIF',
      };

      mockUsersService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(userId);

      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const userId = 'uuid-123';

      const expectedResult = {
        totalDossiers: 10,
        dossiersActifs: 5,
        totalTaches: 25,
        tachesCompletees: 15,
        totalEvenements: 8,
        evenementsAVenir: 3,
        notificationsNonLues: 2,
      };

      mockUsersService.getUserStats.mockResolvedValue(expectedResult);

      const result = await controller.getUserStats(userId);

      expect(service.getUserStats).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getUserDossiers', () => {
    it('should return user dossiers', async () => {
      const userId = 'uuid-123';
      const query: QueryUsersDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      const expectedResult = {
        data: [
          {
            id: 'dossier-uuid-123',
            titre: 'Test Dossier',
            description: 'Test Description',
            statut: 'ACTIF',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockUsersService.getUserDossiers.mockResolvedValue(expectedResult);

      const result = await controller.getUserDossiers(userId, query);

      expect(service.getUserDossiers).toHaveBeenCalledWith(userId, query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getUserTaches', () => {
    it('should return user tasks', async () => {
      const userId = 'uuid-123';
      const query: QueryUsersDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      const expectedResult = {
        data: [
          {
            id: 'tache-uuid-123',
            titre: 'Test Task',
            description: 'Test Description',
            statut: 'EN_COURS',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockUsersService.getUserTaches.mockResolvedValue(expectedResult);

      const result = await controller.getUserTaches(userId, query);

      expect(service.getUserTaches).toHaveBeenCalledWith(userId, query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getUserEvenements', () => {
    it('should return user events', async () => {
      const userId = 'uuid-123';
      const query: QueryUsersDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      const expectedResult = {
        data: [
          {
            id: 'evenement-uuid-123',
            titre: 'Test Event',
            description: 'Test Description',
            dateDebut: new Date(),
            dateFin: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockUsersService.getUserEvenements.mockResolvedValue(expectedResult);

      const result = await controller.getUserEvenements(userId, query);

      expect(service.getUserEvenements).toHaveBeenCalledWith(userId, query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications', async () => {
      const userId = 'uuid-123';
      const query: QueryUsersDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      const expectedResult = {
        data: [
          {
            id: 'notification-uuid-123',
            titre: 'Test Notification',
            message: 'Test Message',
            lue: false,
            createdAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockUsersService.getUserNotifications.mockResolvedValue(expectedResult);

      const result = await controller.getUserNotifications(userId, query);

      expect(service.getUserNotifications).toHaveBeenCalledWith(userId, query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = 'uuid-123';
      const updateUserDto: UpdateUserDto = {
        email: 'updated@example.com',
        prenom: 'Updated',
        nom: 'User',
      };

      const expectedResult = {
        id: 'uuid-123',
        email: 'updated@example.com',
        prenom: 'Updated',
        nom: 'User',
        role: 'AVOCAT',
        statut: 'ACTIF',
      };

      mockUsersService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(userId, updateUserDto);

      expect(service.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const userId = 'uuid-123';
      const changePasswordDto: ChangerPasswordDto = {
        ancienMotDePasse: 'oldpassword',
        nouveauMotDePasse: 'newpassword',
      };

      const expectedResult = {
        success: true,
        message: 'Mot de passe changé avec succès',
      };

      mockUsersService.changePassword.mockResolvedValue(expectedResult);

      const result = await controller.changePassword(userId, changePasswordDto);

      expect(service.changePassword).toHaveBeenCalledWith(
        userId,
        changePasswordDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('markNotificationsAsRead', () => {
    it('should mark all notifications as read', async () => {
      const userId = 'uuid-123';

      const expectedResult = {
        success: true,
        message: 'Notifications marquées comme lues avec succès',
      };

      mockUsersService.markNotificationsAsRead.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.markNotificationsAsRead(userId);

      expect(service.markNotificationsAsRead).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should deactivate a user', async () => {
      const userId = 'uuid-123';

      const expectedResult = {
        success: true,
        message: 'Utilisateur désactivé avec succès',
      };

      mockUsersService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(userId);

      expect(service.remove).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });
  });

  // Tests pour les endpoints de profil utilisateur
  describe('getMyProfile', () => {
    it('should return current user profile', async () => {
      const userId = 'uuid-123';

      const expectedResult = {
        id: 'uuid-123',
        email: 'test@example.com',
        prenom: 'Test',
        nom: 'User',
        role: 'AVOCAT',
        statut: 'ACTIF',
      };

      mockUsersService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.getMyProfile(userId);

      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getMyStats', () => {
    it('should return current user statistics', async () => {
      const userId = 'uuid-123';

      const expectedResult = {
        totalDossiers: 10,
        dossiersActifs: 5,
        totalTaches: 25,
        tachesCompletees: 15,
        totalEvenements: 8,
        evenementsAVenir: 3,
        notificationsNonLues: 2,
      };

      mockUsersService.getUserStats.mockResolvedValue(expectedResult);

      const result = await controller.getMyStats(userId);

      expect(service.getUserStats).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getMyDossiers', () => {
    it('should return current user dossiers', async () => {
      const userId = 'uuid-123';
      const query: QueryUsersDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      const expectedResult = {
        data: [
          {
            id: 'dossier-uuid-123',
            titre: 'Test Dossier',
            description: 'Test Description',
            statut: 'ACTIF',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockUsersService.getUserDossiers.mockResolvedValue(expectedResult);

      const result = await controller.getMyDossiers(userId, query);

      expect(service.getUserDossiers).toHaveBeenCalledWith(userId, query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getMyTaches', () => {
    it('should return current user tasks', async () => {
      const userId = 'uuid-123';
      const query: QueryUsersDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      const expectedResult = {
        data: [
          {
            id: 'tache-uuid-123',
            titre: 'Test Task',
            description: 'Test Description',
            statut: 'EN_COURS',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockUsersService.getUserTaches.mockResolvedValue(expectedResult);

      const result = await controller.getMyTaches(userId, query);

      expect(service.getUserTaches).toHaveBeenCalledWith(userId, query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getMyEvenements', () => {
    it('should return current user events', async () => {
      const userId = 'uuid-123';
      const query: QueryUsersDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      const expectedResult = {
        data: [
          {
            id: 'evenement-uuid-123',
            titre: 'Test Event',
            description: 'Test Description',
            dateDebut: new Date(),
            dateFin: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockUsersService.getUserEvenements.mockResolvedValue(expectedResult);

      const result = await controller.getMyEvenements(userId, query);

      expect(service.getUserEvenements).toHaveBeenCalledWith(userId, query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getMyNotifications', () => {
    it('should return current user notifications', async () => {
      const userId = 'uuid-123';
      const query: QueryUsersDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      const expectedResult = {
        data: [
          {
            id: 'notification-uuid-123',
            titre: 'Test Notification',
            message: 'Test Message',
            lue: false,
            createdAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockUsersService.getUserNotifications.mockResolvedValue(expectedResult);

      const result = await controller.getMyNotifications(userId, query);

      expect(service.getUserNotifications).toHaveBeenCalledWith(userId, query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('changeMyPassword', () => {
    it('should change current user password', async () => {
      const userId = 'uuid-123';
      const changePasswordDto: ChangerPasswordDto = {
        ancienMotDePasse: 'oldpassword',
        nouveauMotDePasse: 'newpassword',
      };

      const expectedResult = {
        success: true,
        message: 'Mot de passe changé avec succès',
      };

      mockUsersService.changePassword.mockResolvedValue(expectedResult);

      const result = await controller.changeMyPassword(
        userId,
        changePasswordDto,
      );

      expect(service.changePassword).toHaveBeenCalledWith(
        userId,
        changePasswordDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('markMyNotificationsAsRead', () => {
    it('should mark all current user notifications as read', async () => {
      const userId = 'uuid-123';

      const expectedResult = {
        success: true,
        message: 'Notifications marquées comme lues avec succès',
      };

      mockUsersService.markNotificationsAsRead.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.markMyNotificationsAsRead(userId);

      expect(service.markNotificationsAsRead).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });
  });
});
