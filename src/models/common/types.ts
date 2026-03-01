export interface Entity {
  id?: number | string; // @PK - flexible for both numeric and UUID
  created?: Date | string; // @audit
}
