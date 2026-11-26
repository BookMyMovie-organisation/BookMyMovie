import { Controller, Get, Param, Body, Post } from '@nestjs/common';
import { MoviesService } from '../../services/movies/movies.service';
import { CreateMovieDto } from '../../dto/create-movie.dto/create-movie.dto';

@Controller('movies')
export class MoviesController {
    constructor(
        private readonly movieService: MoviesService,
    ) {}

    @Get()
    findAll() {
        return this.movieService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.movieService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateMovieDto) {
        return this.movieService.create(dto);
    }
}
