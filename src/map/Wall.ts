import { Box3, BoxGeometry, Mesh, MeshStandardMaterial, Vector3 } from "three";
import GameEntity from "../entities/GameEntity";
import ResourceManager from "../utils/ResourceManager";

class Wall extends GameEntity {
  constructor(position: Vector3) {
    super(position);
  }

  public load = async () => {
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshStandardMaterial({
      map: ResourceManager.instance.getTexture("wall"),
    });
    this._mesh = new Mesh(geometry, material);
    // set position
    this._mesh.position.set(
      this._position.x,
      this._position.y,
      this._position.z
    );

    // create a collider for this object
    this._collider = new Box3().setFromObject(this._mesh);
  };
}

export default Wall;
