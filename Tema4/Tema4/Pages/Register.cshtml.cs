using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Tema4.Controllers;

namespace Tema4.Pages
{
    public class RegisterModel : PageModel
    {
        [BindProperty]
        public Credential Credential { get; set; }

        private readonly IAuthenticationController authenticationController;

        public RegisterModel(IAuthenticationController authenticationController):base()
        {
            this.authenticationController = authenticationController;
        }

        public void OnGet()
        {
        }

        public async void OnPost()
        {
            await authenticationController.Register(Credential.Email);
        }
    }
}
