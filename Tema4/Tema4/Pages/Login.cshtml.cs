using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace Tema4.Pages
{
    public class LoginModel : PageModel
    {
        [BindProperty]
        public Credential Credential { get; set; }



        public void OnGet()
        {
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
