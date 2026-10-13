import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Compound } from './compound.entity';
import { CompoundLike } from './compound-like.entity';

@Entity('electrolysis_users')
export class ElectrolysisUser {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 100, name: 'display_name' })
  displayName!: string;

  @OneToMany(() => Compound, (compound) => compound.creator)
  compounds!: Compound[];

  @OneToMany(() => CompoundLike, (like) => like.user)
  likes!: CompoundLike[];
}
