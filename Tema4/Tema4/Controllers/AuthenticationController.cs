using Tema4.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using Tema4.Models;

namespace Tema4.Controllers
{
    public class AuthenticationController
    {
        private readonly MyDbContext context;

        public AuthenticationController(MyDbContext context)
        {
            this.context = context;
        }

        public async Task Register(string email)
        {
            var user = await context.Users.FirstOrDefaultAsync(user => user.Email == email);
            if (user == null)
            {
                await context.AddAsync(new User { Email = email });
                await context.SaveChangesAsync();
            }
        }

    }
}
