using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;
using Tema4.Controllers;

namespace Tema4.Pages
{
    public class LoginModel : PageModel
    {
        [BindProperty]
        public Credential Credential { get; set; }



        public void OnGet()
        {
            /*AuthenticationController authentication = new AuthenticationController { };
            this.Credential = new Credential { Email = "email" };
            if (authentication.UserExistAsync(this.Credential.Email))
            {
               
            }*/

        }

        public void OnPost()
        {

        }
    }

    public class Credential
    {

        [Required]
        [DataType(DataType.EmailAddress)]
        public string Email { get; set; }


    }
}
