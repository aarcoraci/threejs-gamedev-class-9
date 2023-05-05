import {
  DodecahedronGeometry,
  Material,
  Mesh,
  MeshPhongMaterial,
  Vector3,
} from "three";
import GameEntity from "../entities/GameEntity";
import { randomIntInRange, randomSign } from "../utils/MathUtils";

class ExplosionEffect extends GameEntity {
  private _size: number;
  private _effectDuration = 0.5;
  private _currentDuration: number;
  private _fireMesh: Mesh = new Mesh();

  constructor(position: Vector3, size: number) {
    super(position);
    this._size = size;
    this._currentDuration = this._effectDuration;
  }

  public load = async () => {
    // define generic particle geometry
    const particleGeometry = new DodecahedronGeometry(this._size, 0);
    const totalParticles = randomIntInRange(7, 13);
    const fireMaterial = new MeshPhongMaterial({ color: 0xff4500 });

    for (let i = 0; i < totalParticles; i++) {
      // random angle
      const particleAngle = Math.random() * Math.PI * 2;
      const fireGeometry = particleGeometry.clone(); // need to clone to have unique particles
      const particleSize =
        0.3 * this._size + Math.random() * this._size * 0.4 * randomSign();

      fireGeometry.scale(particleSize, particleSize, particleSize);
      fireGeometry.rotateX(Math.random() * Math.PI);
      fireGeometry.rotateY(Math.random() * Math.PI);
      fireGeometry.rotateZ(Math.random() * Math.PI);

      const fireParticle = new Mesh(fireGeometry, fireMaterial);
      fireParticle.userData = {
        angle: particleAngle,
        speed: 0.5 + Math.random() * 2.5,
      };
      this._fireMesh.add(fireParticle);
    }
    this._mesh.add(this._fireMesh);
  };

  public update = (deltaT: number) => {
    this._currentDuration -= deltaT;
    if (this._currentDuration <= 0) {
      this._shouldDispose = true;
      return;
    }

    // reduce the particles as the effects progresses
    const scale = this._currentDuration / this._effectDuration;
    this._fireMesh.children.forEach((element) => {
      const fireParticle = element as Mesh;
      const angle = fireParticle.userData["angle"];
      const speed = fireParticle.userData["speed"];
      const computedMovement = new Vector3(
        speed * Math.sin(angle) * deltaT,
        -speed * Math.cos(angle) * deltaT,
        0
      );
      fireParticle.scale.set(scale, scale, scale);
      fireParticle.position.add(computedMovement);
    });
  };

  public dispose = () => {
    this._fireMesh.children.forEach((element) => {
      const fireParticle = element as Mesh;
      (fireParticle.material as Material).dispose();
      fireParticle.geometry.dispose();
      this._fireMesh.remove(fireParticle);
    });
    this._mesh.remove(this._fireMesh);
  };
}

export default ExplosionEffect;
