import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Compound } from './compound.entity';
import { CompoundLike } from './compound-like.entity';

const BASE_USER_PASSWORD = 'password';

@Entity('electrolyses_users')
export class ElectrolysesUser {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 100, name: 'display_name' })
  displayName!: string;

  @Column({ type: 'varchar', length: 128, default: BASE_USER_PASSWORD })
  password!: string;

  @OneToMany(() => Compound, (compound) => compound.creator)
  compounds!: Compound[];

  @OneToMany(() => CompoundLike, (like) => like.user)
  likes!: CompoundLike[];
}
