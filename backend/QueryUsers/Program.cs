using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using LimsApi.Data;
using LimsApi.Models;
using Microsoft.Extensions.Configuration;

var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("../LimsApi/appsettings.json", optional: false)
    .AddJsonFile("../LimsApi/appsettings.Development.json", optional: true)
    .Build();

var connectionString = configuration.GetConnectionString("DefaultConnection");

var optionsBuilder = new DbContextOptionsBuilder<LimsDbContext>();
optionsBuilder.UseNpgsql(connectionString);

using var context = new LimsDbContext(optionsBuilder.Options);

Console.WriteLine("Querying users from database...\n");

var users = await context.Users
    .OrderBy(u => u.CreatedAt)
    .ToListAsync();

if (users.Count == 0)
{
    Console.WriteLine("No users found in the database.");
    Console.WriteLine("\nDefault admin credentials (from SeedData.cs):");
    Console.WriteLine("Email: admin@life360omics.com");
    Console.WriteLine("Password: Admin123!");
}
else
{
    Console.WriteLine($"Found {users.Count} user(s):\n");
    Console.WriteLine("=".PadRight(80, '='));
    
    foreach (var user in users)
    {
        Console.WriteLine($"Email:    {user.Email}");
        Console.WriteLine($"Name:     {user.Name}");
        Console.WriteLine($"Role:     {user.Role}");
        Console.WriteLine($"Created:  {user.CreatedAt:yyyy-MM-dd HH:mm:ss}");
        Console.WriteLine($"Updated:  {user.UpdatedAt:yyyy-MM-dd HH:mm:ss}");
        Console.WriteLine($"ID:       {user.Id}");
        Console.WriteLine("-".PadRight(80, '-'));
    }
    
    Console.WriteLine("\nNote: Passwords are hashed in the database.");
    Console.WriteLine("If no users exist, the default admin user should be:");
    Console.WriteLine("  Email: admin@life360omics.com");
    Console.WriteLine("  Password: Admin123!");
}

