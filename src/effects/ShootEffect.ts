import { DodecahedronGeometry, Mesh, MeshPhongMaterial, Vector3 } from "three";
import GameEntity from "../entities/GameEntity";
import { randomIntInRange, randomSign } from "../utils/MathUtils";

class ShootEffect extends GameEntity {
  private _angle: number;
  private _fire = new Mesh();
  private _smoke = new Mesh();
  private _size = 0.1;
  private _effectDuration = 1; // in seconds

  constructor(position: Vector3, angle: number) {
    super(position);
    this._angle = angle;
  }

  public load = async () => {
    const particleGeometry = new DodecahedronGeometry(this._size, 0);
    // materials for each type of particle
    const smokeMaterial = new MeshPhongMaterial({
      color: 0xfafafa,
      transparent: true,
    });

    const fireMaterial = new MeshPhongMaterial({ color: 0xff4500 });

    // get a random number of particles
    const totalParticles = randomIntInRange(4, 9);
    for (let i = 0; i < totalParticles; i++) {
      // build a random angle offset (very small)
      const angleOffest = Math.PI * 0.08 * Math.random() * randomSign();
      // each particle will have a random speed
      const particleSpeed = 1.75 * Math.random() * 3;
      // build a fire particle
      const fireParticle = new Mesh(particleGeometry, fireMaterial);
      // store this particle info
      fireParticle.userData = {
        angle: this._angle + angleOffest,
        speed: particleSpeed,
      };
      this._fire.add(fireParticle);

      // create smoke particles
      const smokePositionOffest = new Vector3(
        Math.random() * this._size * randomSign(),
        Math.random() * this._size * randomSign(),
        Math.random() * this._size * randomSign()
      );
      const smokeParticle = new Mesh(particleGeometry, smokeMaterial);
      smokeParticle.position.add(smokePositionOffest);
      this._smoke.add(smokeParticle);
    }

    // complete the game entity mesh with each part
    this._mesh.add(this._fire);
    this._mesh.add(this._smoke);
  };

  public update = (deltaT: number) => {
    // update duration
    this._effectDuration -= deltaT;
    if (this._effectDuration <= 0) {
      this._shouldDispose = true;
      return;
    }

    this._fire.children.forEach((element) => {
      const fireParticle = element as Mesh;
      const angle = fireParticle.userData["angle"];
      const speed = fireParticle.userData["speed"];
      // calculate movement
      const computedMovement = new Vector3(
        speed * Math.sin(angle) * deltaT * this._effectDuration * 0.75,
        -speed * Math.cos(angle) * deltaT * this._effectDuration * 0.75
      );
      fireParticle.position.add(computedMovement);
      // update the size (will get smaller as the effects progress)
      fireParticle.scale.set(
        (fireParticle.scale.x = this._effectDuration),
        (fireParticle.scale.y = this._effectDuration),
        (fireParticle.scale.z = this._effectDuration)
      );
    });

    // update smoke opacity and position
    this._smoke.children.forEach((element) => {
      const smokeParticle = element as Mesh;
      (smokeParticle.material as MeshPhongMaterial).opacity =
        this._effectDuration;
      smokeParticle.position.add(new Vector3(0, 0, 3 * deltaT));
    });
  };

  public dispose = () => {
    this._fire.children.forEach((element) => {
      (element as Mesh).geometry.dispose();
      ((element as Mesh).material as MeshPhongMaterial).dispose();
      this._fire.remove(element);
    });

    this._mesh.remove(this._fire);

    this._smoke.children.forEach((element) => {
      (element as Mesh).geometry.dispose();
      ((element as Mesh).material as MeshPhongMaterial).dispose();
      this._smoke.remove(element);
    });

    this._mesh.remove(this._smoke);
  };
}

export default ShootEffect;
