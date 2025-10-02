import { Test, TestingModule } from '@nestjs/testing';
import { DossiersController } from './dossiers.controller';
import { DossiersService } from './dossiers.service';

describe('DossiersController', () => {
  let controller: DossiersController;
  let service: Partial<Record<keyof DossiersService, any>>;

  beforeEach(async () => {
    service = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      softDelete: jest.fn(),
      findDocuments: jest.fn(),
      findTasks: jest.fn(),
      findCalendarEvents: jest.fn(),
      findChatMessagesPaginated: jest.fn(),
      findNotesPaginated: jest.fn(),
      addNote: jest.fn(),
      updateNote: jest.fn(),
      softDeleteNote: jest.fn(),
      findEvents: jest.fn(),
      assignDossier: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DossiersController],
      providers: [{ provide: DossiersService, useValue: service }],
    }).compile();

    controller = module.get<DossiersController>(DossiersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findOne should call service.findOne', async () => {
    const mockDossier = { id: '1' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    service.findOne.mockResolvedValue(mockDossier);

    const result = await controller.findOne('1');
    expect(service.findOne).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockDossier);
  });

  it('create should call service.create', async () => {
    const dto = { titre: 'Test', type: 'AUTRE', clientId: 'c1' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    service.create.mockResolvedValue({ id: 'd1', ...dto });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = await controller.create(dto as any);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result.id).toBe('d1');
  });

  it('updateStatus should call service.updateStatus', async () => {
    const dto = { statut: 'CLOS' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    service.updateStatus.mockResolvedValue({ message: 'ok' });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = await controller.updateStatus('1', dto as any);
    expect(service.updateStatus).toHaveBeenCalledWith('1', 'CLOS');
    expect(result.message).toBe('ok');
  });
  it('softDelete should call service.softDelete', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    service.softDelete.mockResolvedValue({ message: 'deleted' });

    const result = await controller.softDelete('1', 'user123');
    expect(service.softDelete).toHaveBeenCalledWith('1', 'user123');
    expect(result.message).toBe('deleted');
  });

  it('getDocuments should call service.findDocuments', async () => {
    const docs = [{ id: 'doc1' }];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    service.findDocuments.mockResolvedValue(docs);

    const result = await controller.getDocuments('1');
    expect(service.findDocuments).toHaveBeenCalledWith('1');
    expect(result).toEqual(docs);
  });

  it('getTasks should call service.findTasks', async () => {
    const tasks = [{ id: 'task1' }];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    service.findTasks.mockResolvedValue(tasks);

    const result = await controller.getTasks('1');
    expect(service.findTasks).toHaveBeenCalledWith('1');
    expect(result).toEqual(tasks);
  });

  it('getCalendarEvents should call service.findCalendarEvents', async () => {
    const events = [{ id: 'event1' }];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    service.findCalendarEvents.mockResolvedValue(events);

    const result = await controller.getCalendarEvents('1');
    expect(service.findCalendarEvents).toHaveBeenCalledWith('1');
    expect(result).toEqual(events);
  });

  it('getChatMessages should call service.findChatMessagesPaginated', async () => {
    const messages = [{ id: 'msg1' }];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    service.findChatMessagesPaginated.mockResolvedValue(messages);

    const result = await controller.getChatMessages('1', '5', '10');
    expect(service.findChatMessagesPaginated).toHaveBeenCalledWith('1', 5, 10);
    expect(result).toEqual(messages);
  });

  it('getNotes should call service.findNotesPaginated', async () => {
    const notes = [{ id: 'note1' }];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    service.findNotesPaginated.mockResolvedValue(notes);

    const result = await controller.getNotes('1', '2', '5');
    expect(service.findNotesPaginated).toHaveBeenCalledWith('1', 2, 5);
    expect(result).toEqual(notes);
  });

  it('addNote should call service.addNote', async () => {
    const newNote = { contenu: 'note test' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    service.addNote.mockResolvedValue({ id: 'n1', ...newNote });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = await controller.addNote('1', newNote as any, 'user123');
    expect(service.addNote).toHaveBeenCalledWith('1', newNote, 'user123');
    expect(result.id).toBe('n1');
  });

  it('updateNote should call service.updateNote', async () => {
    const updatedNote = { contenu: 'updated' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    service.updateNote.mockResolvedValue({ id: 'n1', ...updatedNote });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = await controller.updateNote('1', 'n1', updatedNote as any);
    expect(service.updateNote).toHaveBeenCalledWith('1', 'n1', updatedNote);
    expect(result.contenu).toBe('updated');
  });

  it('deleteNote should call service.softDeleteNote', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    service.softDeleteNote.mockResolvedValue({ message: 'note deleted' });

    const result = await controller.deleteNote('1', 'n1');
    expect(service.softDeleteNote).toHaveBeenCalledWith('1', 'n1');
    expect(result.message).toBe('note deleted');
  });

  it('getEvents should call service.findEvents', async () => {
    const events = [{ id: 'event1' }];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    service.findEvents.mockResolvedValue(events);

    const result = await controller.getEvents('1');
    expect(service.findEvents).toHaveBeenCalledWith('1');
    expect(result).toEqual(events);
  });

  it('assignDossier should call service.assignDossier', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    service.assignDossier.mockResolvedValue({ message: 'assigned' });

    const assignDto = { nouveauResponsableId: 'user456' };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = await controller.assignDossier('1', assignDto as any);
    expect(service.assignDossier).toHaveBeenCalledWith('1', 'user456');
    expect(result.message).toBe('assigned');
  });

  // ⚡️ On peut répéter pour tous les endpoints : softDelete, getDocuments, getTasks, getCalendarEvents, getChatMessages, getNotes, addNote, updateNote, deleteNote, getEvents, assignDossier...
});
