import { Box3, Mesh, MeshStandardMaterial, Sphere, Vector3 } from "three";
import GameEntity from "./GameEntity";
import ResourceManager from "../utils/ResourceManager";
import GameScene from "../scene/GameScene";
import Bullet from "./Bullet";
import ShootEffect from "../effects/ShootEffect";

// helper to track keyboard state
type KeyboardState = {
  LeftPressed: boolean;
  RightPressed: boolean;
  UpPressed: boolean;
  DownPressed: boolean;
};

class PlayerTank extends GameEntity {
  private _rotation: number = 0;

  private _keyboardState: KeyboardState = {
    LeftPressed: false,
    RightPressed: false,
    UpPressed: false,
    DownPressed: false,
  };

  constructor(position: Vector3) {
    super(position, "player");
    // listen to the methods that track keyboard state
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  // handle key pressing
  private handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        this._keyboardState.UpPressed = true;
        break;
      case "ArrowDown":
        this._keyboardState.DownPressed = true;
        break;
      case "ArrowLeft":
        this._keyboardState.LeftPressed = true;
        break;
      case "ArrowRight":
        this._keyboardState.RightPressed = true;
        break;
      default:
        break;
    }
  };

  private handleKeyUp = async (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        this._keyboardState.UpPressed = false;
        break;
      case "ArrowDown":
        this._keyboardState.DownPressed = false;
        break;
      case "ArrowLeft":
        this._keyboardState.LeftPressed = false;
        break;
      case "ArrowRight":
        this._keyboardState.RightPressed = false;
        break;
      case " ":
        await this.shoot();
        break;
      default:
        break;
    }
  };

  private shoot = async () => {
    // create an offset position (shoot a bit ahead of the tank)
    const offset = new Vector3(
      Math.sin(this._rotation) * 0.45,
      -Math.cos(this._rotation) * 0.45,
      0.5
    );
    const shootingPosition = this._mesh.position.clone().add(offset);
    // create and load the bullet
    const bullet = new Bullet(shootingPosition, this._rotation);
    await bullet.load();

    // add effect
    const shootEffect = new ShootEffect(shootingPosition, this._rotation);
    await shootEffect.load();

    GameScene.instance.addToScene(shootEffect);
    GameScene.instance.addToScene(bullet);
  };

  public load = async () => {
    // ask the models and textures to the resource manager
    const tankModel = ResourceManager.instance.getModel("tank");
    if (!tankModel) {
      throw "unable to get tank model";
    }

    // entities using models will require a unique instance
    const tankSceneData = tankModel.scene.clone();

    // the model contains the meshes we need for the scene
    const tankBodyMesh = tankSceneData.children.find(
      (m) => m.name === "Body"
    ) as Mesh;

    const tankTurretMesh = tankSceneData.children.find(
      (m) => m.name === "Turret"
    ) as Mesh;

    const tankBodyTexture = ResourceManager.instance.getTexture("tank-body");
    const tankTurretTexture =
      ResourceManager.instance.getTexture("tank-turret");

    if (
      !tankBodyMesh ||
      !tankTurretMesh ||
      !tankBodyTexture ||
      !tankTurretTexture
    ) {
      throw "unable to load player model or textures";
    }

    // with all the assets we can build the final mesh and materials
    const bodyMaterial = new MeshStandardMaterial({
      map: tankBodyTexture,
    });
    const turretMaterial = new MeshStandardMaterial({
      map: tankTurretTexture,
    });

    tankBodyMesh.material = bodyMaterial;
    tankTurretMesh.material = turretMaterial;

    // add meshes as child of entity mesh
    this._mesh.add(tankBodyMesh);
    this._mesh.add(tankTurretMesh);

    // create the collider for the tank
    const collider = new Box3()
      .setFromObject(this._mesh)
      .getBoundingSphere(new Sphere(this._mesh.position.clone()));
    // this creates a sphere around the tank which is easier to calculate with other collisions
    // reduce the radius a bit
    collider.radius *= 0.75;
    this._collider = collider;
  };

  public update = (deltaT: number) => {
    let computedRotation = this._rotation;
    let computedMovement = new Vector3(); // final movement for this frame
    const moveSpeed = 2; // in tiles per second

    if (this._keyboardState.LeftPressed) {
      computedRotation += Math.PI * deltaT;
    } else if (this._keyboardState.RightPressed) {
      computedRotation -= Math.PI * deltaT;
    }

    // keep computed rotation between 0 and 2PI
    const fullCircle = Math.PI * 2;
    if (computedRotation > fullCircle) {
      computedRotation = fullCircle - computedRotation;
    } else if (computedRotation < 0) {
      computedRotation = fullCircle + computedRotation;
    }

    // decompose movement depending on rotation
    const yMovement = moveSpeed * deltaT * Math.cos(computedRotation);
    const xMovement = moveSpeed * deltaT * Math.sin(computedRotation);
    if (this._keyboardState.UpPressed) {
      computedMovement = new Vector3(xMovement, -yMovement, 0);
    } else if (this._keyboardState.DownPressed) {
      computedMovement = new Vector3(-xMovement, yMovement, 0);
    }

    this._rotation = computedRotation;
    this._mesh.setRotationFromAxisAngle(new Vector3(0, 0, 1), computedRotation);

    // before updating the position check if there is a problem with the new one
    const testingSphere = this._collider?.clone() as Sphere;
    testingSphere.center.add(computedMovement);

    // search for possible collisions
    const colliders = GameScene.instance.gameEntities.filter(
      (e) =>
        e !== this &&
        e.entityType !== "bullet" &&
        e.collider &&
        e.collider!.intersectsSphere(testingSphere)
    );

    // something is blocking the tank !
    if (colliders.length) {
      return;
    }

    // update the current position by adding the movement
    this._mesh.position.add(computedMovement);
    // update the collider as well
    (this._collider as Sphere).center.add(computedMovement);

    // make the camera follow the player tank
    GameScene.instance.camera.position.set(
      this._mesh.position.x,
      this._mesh.position.y,
      GameScene.instance.camera.position.z
    );
  };
}

export default PlayerTank;
