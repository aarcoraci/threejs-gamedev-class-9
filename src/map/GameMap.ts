import { Mesh, MeshStandardMaterial, PlaneGeometry, Vector3 } from "three";
import GameEntity from "../entities/GameEntity";
import ResourceManager from "../utils/ResourceManager";

class MapTile extends GameEntity {
  constructor(position: Vector3) {
    super(position);
  }

  public load = async () => {
    const tileTexture = ResourceManager.instance.getRandomGroundTexture();
    const geometry = new PlaneGeometry(1, 1);
    const material = new MeshStandardMaterial({
      map: tileTexture,
    });

    this._mesh = new Mesh(geometry, material);
    this._mesh.position.set(
      this._position.x,
      this._position.y,
      this._position.z
    );
  };
}

class GameMap extends GameEntity {
  private _size: number;
  // map tiles
  private _tiles: MapTile[] = [];

  constructor(position: Vector3, size: number) {
    super(position);
    this._size = size;

    // build the grid
    for (let i = 0; i < this._size; i++) {
      for (let j = 0; j < this._size; j++) {
        // add a new tile at i,j position
        this._tiles.push(new MapTile(new Vector3(i, j, 0)));
      }
    }
  }

  // load the tiles and add them to this map mesh object
  public load = async () => {
    for (let index = 0; index < this._tiles.length; index++) {
      const element = this._tiles[index];
      await element.load();
      this._mesh.add(element.mesh);
    }
  };
}

export default GameMap;
