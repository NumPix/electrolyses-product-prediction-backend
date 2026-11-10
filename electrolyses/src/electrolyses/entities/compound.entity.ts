import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ElectrolysesUser } from './electrolyses-user.entity';
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

  @Column({ type: 'varchar', length: 120, name: 'compound_name' })
  name!: string;

  @Column({ type: 'text', name: 'short_description', nullable: true })
  shortDescription!: string | null;

  @Column({ type: 'varchar', length: 20, default: CompoundStatus.Draft })
  status!: CompoundStatus;

  @Column({ type: 'varchar', length: 255, name: 'image_key' })
  imgSrc!: string;

  @Column({ type: 'varchar', length: 255, name: 'video_key' })
  vidSrc!: string;

  @Column({ type: 'double precision', name: 'anode_cathode_mass_ratio', nullable: true })
  anodeCathodeMassRatio!: number | null;

  @Column({ type: 'double precision', name: 'concentration_percent', nullable: true })
  concentration!: number | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp', name: 'formed_at', nullable: true })
  formedAt!: Date | null;

  @ManyToOne(() => ElectrolysesUser, (user) => user.compounds, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'creator_id' })
  creator!: ElectrolysesUser;

  @OneToMany(() => CompoundLike, (like) => like.compound)
  likes!: CompoundLike[];
}
