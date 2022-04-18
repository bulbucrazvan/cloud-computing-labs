using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;
using Tema4.Controllers;
using Tema4.Models;

namespace Tema4.Pages
{
    public class LoginModel : PageModel
    {
        private readonly IAuthenticationController authenticationController;

        [BindProperty]
        public Credential Credential { get; set; }

        public LoginModel(IAuthenticationController authenticationController):base()
        {
            this.authenticationController = authenticationController;
        }

        public void OnGet()
        {
            /*AuthenticationController authentication = new AuthenticationController { };
            this.Credential = new Credential { Email = "email" };
            if (authentication.UserExistAsync(this.Credential.Email))
            {
               
            }*/
            

        }

        public async void OnPost()
        {
            User user = await authenticationController.UserExistAsync(Credential.Email);
        }
    }

    public class Credential
    {

        [Required]
        [DataType(DataType.EmailAddress)]
        public string Email { get; set; }


    }
}
