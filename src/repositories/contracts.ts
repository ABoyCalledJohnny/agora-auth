export interface BaseRepository<T, TNew, TId = string> {
  create(data: TNew): Promise<T>;
  findById(id: TId): Promise<T | null>;
  delete(id: TId): Promise<T>;
}

export interface CrudRepository<T, TNew, TUpdate, TId = string> extends BaseRepository<T, TNew, TId> {
  findAll(): Promise<T[]>;
  update(id: TId, data: TUpdate): Promise<T>;
}
