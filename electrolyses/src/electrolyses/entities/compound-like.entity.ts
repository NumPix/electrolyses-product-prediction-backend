import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Compound } from './compound.entity';
import { ElectrolysesUser } from './electrolyses-user.entity';

@Entity('electrolyte_solution_likes')
@Unique('uq_electrolyte_solution_likes_compound_user', ['compoundId', 'userId'])
export class CompoundLike {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'compound_id' })
  compoundId!: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId!: number;

  @ManyToOne(() => Compound, (compound) => compound.likes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'compound_id' })
  compound!: Compound;

  @ManyToOne(() => ElectrolysesUser, (user) => user.likes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user!: ElectrolysesUser;
}
