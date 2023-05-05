import { Box3, Mesh, Sphere, Vector3 } from "three";

// discriminator for the type of entity
type EntityType = "general" | "player" | "bullet" | "enemy";

abstract class GameEntity {
  protected _position: Vector3;
  protected _mesh: Mesh = new Mesh();
  public get mesh() {
    return this._mesh;
  }

  protected _collider?: Box3 | Sphere;
  public get collider() {
    return this._collider;
  }

  protected _entityType: EntityType;
  public get entityType() {
    return this._entityType;
  }

  // flag to let the GameScene know this entity will be disposed
  protected _shouldDispose = false;
  public get shouldDispose() {
    return this._shouldDispose;
  }

  constructor(position: Vector3, entityType: EntityType = "general") {
    this._position = position;
    this._mesh.position.set(
      this._position.x,
      this._position.y,
      this._position.z
    );
    this._entityType = entityType;
  }

  // methods
  public load = async () => {};
  public update = (_deltaT: number) => {};
  // method to be called before disposing the entity (to free resrouces)
  public dispose = () => {};
}

export default GameEntity;
