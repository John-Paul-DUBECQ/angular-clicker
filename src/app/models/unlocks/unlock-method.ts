/** Etat minimal nécessaire pour évaluer une règle de déblocage. */
export interface UnlockContext {
  clicks: number;
  totalManualClicks?: number;
  getWorkerLevel: (workerIndex: number) => number | null;
  getShopItemBought?: (ref: string | number) => boolean;
  getEssenceShopItemLevel?: (itemId: string) => number;
  getHouseLevel?: (houseId: string) => number;
  getPowerBought?: (powerId: string) => boolean;
}

export type UnlockPredicate = (context: UnlockContext) => boolean;

export interface WorkerLevelRequirement {
  workerIndex: number;
  level: number;
}

/**
 * Règle de déblocage composable.
 * Les fabriques statiques couvrent les règles connues et `all`/`any` permettent
 * de construire des conditions plus complexes sans les coder dans les modèles.
 */
export class UnlockMethod {
  private constructor(
    private readonly predicate: UnlockPredicate,
    readonly description?: string,
    private readonly workerLevelRequirements: WorkerLevelRequirement[] = []
  ) {}

  isUnlocked(context: UnlockContext): boolean {
    return this.predicate(context);
  }

  and(...methods: UnlockMethod[]): UnlockMethod {
    return UnlockMethod.all(this, ...methods);
  }

  or(...methods: UnlockMethod[]): UnlockMethod {
    return UnlockMethod.any(this, ...methods);
  }

  getWorkerLevelRequirement(workerIndex: number): number | undefined {
    const levels = this.workerLevelRequirements
      .filter((requirement) => requirement.workerIndex === workerIndex)
      .map((requirement) => requirement.level);
    return levels.length > 0 ? Math.max(...levels) : undefined;
  }

  static custom(
    predicate: UnlockPredicate,
    description?: string,
    workerLevelRequirements: WorkerLevelRequirement[] = []
  ): UnlockMethod {
    return new UnlockMethod(predicate, description, workerLevelRequirements);
  }

  static workerLevel(workerIndex: number, level: number): UnlockMethod {
    return UnlockMethod.custom(
      (context) => (context.getWorkerLevel(workerIndex) ?? 0) >= level,
      `Niveau ${level} du worker ${workerIndex}`,
      [{ workerIndex, level }]
    );
  }

  static workerOwned(workerIndex: number): UnlockMethod {
    return UnlockMethod.workerLevel(workerIndex, 1);
  }

  static minClicks(clicks: number): UnlockMethod {
    return UnlockMethod.custom((context) => context.clicks >= clicks, `${clicks} clics`);
  }

  static minManualClicks(clicks: number): UnlockMethod {
    return UnlockMethod.custom(
      (context) => (context.totalManualClicks ?? 0) >= clicks,
      `${clicks} clics manuels`
    );
  }

  static shopItemBought(ref: string | number): UnlockMethod {
    return UnlockMethod.custom(
      (context) => context.getShopItemBought ? context.getShopItemBought(ref) : false,
      `Achat de l'item ${String(ref)}`
    );
  }

  static essenceShopLevel(itemId: string, level: number): UnlockMethod {
    return UnlockMethod.custom(
      (context) => (context.getEssenceShopItemLevel ? context.getEssenceShopItemLevel(itemId) : 0) >= level,
      `Niveau ${level} de l'item d'essence ${itemId}`
    );
  }

  static houseLevel(houseId: string, level: number): UnlockMethod {
    return UnlockMethod.custom(
      (context) => (context.getHouseLevel ? context.getHouseLevel(houseId) : 0) >= level,
      `Niveau ${level} de la maison ${houseId}`
    );
  }

  static powerBought(powerId: string): UnlockMethod {
    return UnlockMethod.custom(
      (context) => context.getPowerBought ? context.getPowerBought(powerId) : false,
      `Pouvoir ${powerId}`
    );
  }

  static all(...methods: UnlockMethod[]): UnlockMethod {
    return UnlockMethod.custom(
      (context) => methods.every((method) => method.isUnlocked(context)),
      methods.map((method) => method.description).filter(Boolean).join(' et '),
      methods.reduce(
        (requirements, method) => requirements.concat(method.workerLevelRequirements),
        [] as WorkerLevelRequirement[]
      )
    );
  }

  static any(...methods: UnlockMethod[]): UnlockMethod {
    return UnlockMethod.custom(
      (context) => methods.some((method) => method.isUnlocked(context)),
      methods.map((method) => method.description).filter(Boolean).join(' ou '),
      methods.reduce(
        (requirements, method) => requirements.concat(method.workerLevelRequirements),
        [] as WorkerLevelRequirement[]
      )
    );
  }
}