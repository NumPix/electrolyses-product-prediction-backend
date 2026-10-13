import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Compound } from './compound.entity';
import { ElectrolysisUser } from './electrolysis-user.entity';

@Entity('electrolyte_solution_likes')
export class CompoundLike {
  @PrimaryColumn({ type: 'integer', name: 'compound_id' })
  compoundId!: number;

  @PrimaryColumn({ type: 'integer', name: 'user_id' })
  userId!: number;

  @ManyToOne(() => Compound, (compound) => compound.likes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'compound_id' })
  compound!: Compound;

  @ManyToOne(() => ElectrolysisUser, (user) => user.likes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user!: ElectrolysisUser;
}
