import { Injectable } from '@nestjs/common';
import { CreateMovieDto } from '../../dto/create-movie.dto/create-movie.dto';

@Injectable()
export class MoviesService {
    private readonly movies = [
        {id: '1', name: 'Film'},
    ];

    findAll() {
        return this.movies;
    }

    findOne(id: string) {
        return this.movies.find((movie) => movie.id === id);
      }
    
      create(dto: CreateMovieDto) {
        const movie = {
          id: String(this.movies.length + 1),
          ...dto,
        };
    
        this.movies.push(movie);
        return movie;
      }
    }
