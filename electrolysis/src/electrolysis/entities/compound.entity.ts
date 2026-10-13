import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ElectrolysisUser } from './electrolysis-user.entity';
import { CompoundLike } from './compound-like.entity';

export enum CompoundStatus {
  Draft = 'draft',
  Published = 'published',
  Deleted = 'deleted',
}

@Entity('electrolyte_solutions')
export class Compound {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  formula!: string;

  @Column({ type: 'varchar', length: 120, name: 'compound_name' })
  name!: string;

  @Column({ type: 'text', name: 'short_description', default: '' })
  shortDescription!: string;

  @Column({ type: 'varchar', length: 20, default: CompoundStatus.Draft })
  status!: CompoundStatus;

  @Column({ type: 'varchar', length: 255, name: 'image_key', nullable: true })
  imgSrc!: string | null;

  @Column({ type: 'varchar', length: 255, name: 'video_key', nullable: true })
  vidSrc!: string | null;

  @Column({ type: 'double precision', name: 'mass_grams', nullable: true })
  mass!: number | null;

  @Column({ type: 'double precision', name: 'concentration_percent', nullable: true })
  concentration!: number | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp', name: 'formed_at', nullable: true })
  formedAt!: Date | null;

  @ManyToOne(() => ElectrolysisUser, (user) => user.compounds, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'creator_id' })
  creator!: ElectrolysisUser;

  @OneToMany(() => CompoundLike, (like) => like.compound)
  likes!: CompoundLike[];
}
