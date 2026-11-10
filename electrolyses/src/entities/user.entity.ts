import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ElectrolyteSolution } from './electrolyte-solution.entity';
import { ElectrolyteSolutionLike } from './electrolyte-solution-like.entity';

const BASE_USER_PASSWORD = 'password';

@Entity('electrolyses_users')
export class User {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 100, name: 'display_name' })
  displayName!: string;

  @Column({ type: 'varchar', length: 128, default: BASE_USER_PASSWORD })
  password!: string;

  @OneToMany(() => ElectrolyteSolution, (electrolyteSolution) => electrolyteSolution.creator)
  electrolyteSolutions!: ElectrolyteSolution[];

  @OneToMany(() => ElectrolyteSolutionLike, (like) => like.user)
  likes!: ElectrolyteSolutionLike[];
}
