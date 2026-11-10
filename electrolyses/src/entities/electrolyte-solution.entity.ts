import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ElectrolyteSolutionLike } from './electrolyte-solution-like.entity';

export enum ElectrolyteSolutionStatus {
  Draft = 'draft',
  Published = 'published',
  Deleted = 'deleted',
}

@Entity('electrolyte_solutions')
export class ElectrolyteSolution {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 120, name: 'compound_name' })
  compoundName!: string;

  @Column({ type: 'text', name: 'short_description', nullable: true })
  shortDescription!: string | null;

  @Column({ type: 'varchar', length: 20, default: ElectrolyteSolutionStatus.Draft })
  status!: ElectrolyteSolutionStatus;

  @Column({ type: 'varchar', length: 255, name: 'image_key' })
  imageKey!: string;

  @Column({ type: 'varchar', length: 255, name: 'video_key' })
  videoKey!: string;

  @Column({ type: 'double precision', name: 'anode_cathode_mass_ratio', nullable: true })
  anodeCathodeMassRatio!: number | null;

  @Column({ type: 'double precision', name: 'concentration_percent', nullable: true })
  concentrationPercent!: number | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp', name: 'formed_at', nullable: true })
  formedAt!: Date | null;

  @Column({ type: 'integer', name: 'creator_id' })
  creatorId!: number;

  @ManyToOne(() => User, (user) => user.electrolyteSolutions, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'creator_id' })
  creator!: User;

  @OneToMany(() => ElectrolyteSolutionLike, (like) => like.electrolyteSolution)
  likes!: ElectrolyteSolutionLike[];
}
