import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ElectrolyteSolution } from './electrolyte-solution.entity';
import { User } from './user.entity';

@Entity('electrolyte_solution_likes')
@Unique('uq_electrolyte_solution_likes_compound_user', ['compoundId', 'userId'])
export class ElectrolyteSolutionLike {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'compound_id' })
  compoundId!: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId!: number;

  @ManyToOne(() => ElectrolyteSolution, (electrolyteSolution) => electrolyteSolution.likes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'compound_id' })
  electrolyteSolution!: ElectrolyteSolution;

  @ManyToOne(() => User, (user) => user.likes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
