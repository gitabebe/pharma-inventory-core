import { Controller, Post, Body, UseGuards, Get, Delete, Param, Request, ForbiddenException, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateAuthDto } from './dto/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private prisma: PrismaService) {}

  @Post('login')
login(@Body() createAuthDto: CreateAuthDto) { 
  // Make sure to match the field names in your DTO (usually 'password', not 'pass')
  return this.authService.login(createAuthDto.email, createAuthDto.password);
}

  // --- 1. GET EMPLOYEES ---
  @UseGuards(AuthGuard('jwt'))
  @Get('employees')
  async getEmployees(@Request() req: any) {
    const role = req.user.role;
    if (role === 'PHARMACIST') throw new ForbiddenException("Access Denied");

    return this.prisma.user.findMany({
      select: { 
        id: true, name: true, email: true, role: true, isActive: true,
        baseSalary: role === 'HR_MANAGER' ? true : false 
      },
      orderBy: { isActive: 'desc' }
    });
  }

  // --- 2. HIRE USER ---
  @UseGuards(AuthGuard('jwt'))
  @Post('register')
  async register(@Request() req: any, @Body() body: any) {
    const role = req.user.role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_MANAGER') throw new ForbiddenException("Denied.");

    const hashed = await bcrypt.hash(body.pass, 10);
    const salary = role === 'HR_MANAGER' ? body.baseSalary : 0;

    return this.prisma.user.create({
      data: { name: body.name, email: body.email, password: hashed, role: body.role, baseSalary: salary }
    });
  }

  // --- 3. FIRE USER (Soft Delete) ---
  @UseGuards(AuthGuard('jwt'))
  @Delete('users/:id')
  async deleteUser(@Request() req: any, @Param('id') id: string) {
    const role = req.user.role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_MANAGER') throw new ForbiddenException("Denied.");
    if (req.user.userId === id) throw new ForbiddenException("Cannot fire yourself.");

    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }

  // --- 4. EDIT USER (Update Salary/Role) ---
  @UseGuards(AuthGuard('jwt'))
  @Patch('users/:id')
  async updateUser(@Request() req: any, @Param('id') id: string, @Body() body: { role: any, salary: number }) {
    if (req.user.role !== 'HR_MANAGER') throw new ForbiddenException("Only HR can edit contracts.");
    
    return this.prisma.user.update({
      where: { id },
      data: { role: body.role, baseSalary: body.salary }
    });
  }

  // --- 5. GET MY PROFILE (Fix for loading issue) ---
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Request() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true, baseSalary: true, joinDate: true }
    });
    // Ensure numbers are numbers, not strings
    return {
      ...user,
      baseSalary: Number(user?.baseSalary) || 0
    };
  }
}
