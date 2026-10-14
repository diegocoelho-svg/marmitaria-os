export abstract class Entity<Props> {
  protected constructor(
    readonly id: string,
    protected readonly props: Props,
  ) {}
}
