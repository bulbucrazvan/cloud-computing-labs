
using Tema4.Models;

namespace Tema4.Controllers
{
    public interface IAuthenticationController
    {

        Task Register(string email);
        Task<User> UserExistAsync(string email);
    }
}
