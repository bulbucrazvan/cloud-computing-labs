using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Newtonsoft.Json;
using System.Text;

namespace Tema4.Pages
{
    public class IndexModel : PageModel
    {
        private readonly ILogger<IndexModel> _logger;
        private static readonly string subscriptionKey = "57f4dc77a62e488f94f8d555d0e7e2ff";
        private static readonly string endpoint = "https://api.cognitive.microsofttranslator.com/";
        private static readonly string location = "westeurope";
        private static SpeechConfig speechConfig = SpeechConfig.FromSubscription("4a8cea96a0e344dc8791d0396177d27c", "germanywestcentral");
        public Result MyResult { get; set; }
        [BindProperty]
        public string From { get; set; }
        [BindProperty]
        public string To { get; set; }
        [BindProperty]
        public string Input { get; set; }
        [BindProperty]
        public string Output { get; set; }

        public IndexModel(ILogger<IndexModel> logger)
        {
            _logger = logger;
        }

        public async Task<IActionResult> OnGet()
        {
            From = "ro";
            To = "en";
            Input = "Acesta este un test";
            Output = "Acesta este un test";
            string route = "/translate?api-version=3.0&from="   + From
                                                                + "&to=" + To;
            string textToTranslate = Input;
            object[] body = new object[] { new { Text = textToTranslate } };
            var requestBody = JsonConvert.SerializeObject(body);

            using (var client = new HttpClient())
            using (var request = new HttpRequestMessage())
            {
                request.Method = HttpMethod.Post;
                request.RequestUri = new Uri(endpoint + route);
                request.Content = new StringContent(requestBody, Encoding.UTF8, "application/json");
                request.Headers.Add("Ocp-Apim-Subscription-Key", subscriptionKey);
                request.Headers.Add("Ocp-Apim-Subscription-Region", location);

                HttpResponseMessage response = await client.SendAsync(request).ConfigureAwait(false);
                string result = await response.Content.ReadAsStringAsync();
                MyResult = JsonConvert.DeserializeObject<List<Result>>(result)[0];
                Output = MyResult.translations[0].Text;
                await RecognizeFromMic(speechConfig);
                return Page();
            }
        }

        public async Task<IActionResult> OnPost()
        {
            string route = "/translate?api-version=3.0&from=" + From
                                                                + "&to=" + To;
            string textToTranslate = Input;
            object[] body = new object[] { new { Text = textToTranslate } };
            var requestBody = JsonConvert.SerializeObject(body);

            using (var client = new HttpClient())
            using (var request = new HttpRequestMessage())
            {
                request.Method = HttpMethod.Post;
                request.RequestUri = new Uri(endpoint + route);
                request.Content = new StringContent(requestBody, Encoding.UTF8, "application/json");
                request.Headers.Add("Ocp-Apim-Subscription-Key", subscriptionKey);
                request.Headers.Add("Ocp-Apim-Subscription-Region", location);

                HttpResponseMessage response = await client.SendAsync(request).ConfigureAwait(false);
                string result = await response.Content.ReadAsStringAsync();
                MyResult = JsonConvert.DeserializeObject<List<Result>>(result)[0];
                Output = MyResult.translations[0].Text;
                await RecognizeFromMic(speechConfig);
                return Page();
            }
        }
            async static Task SynthesizeToSpeaker()
        {
            //Find your key and resource region under the 'Keys and Endpoint' tab in your Speech resource in Azure Portal
            //Remember to delete the brackets <> when pasting your key and region!
            var config = SpeechConfig.FromSubscription("4a8cea96a0e344dc8791d0396177d27c", "germanywestcentral");
            using var synthesizer = new SpeechSynthesizer(config);
            await synthesizer.SpeakTextAsync("Enter some text to synthesize.");
        }

        async static Task RecognizeFromMic(SpeechConfig speechConfig)
        {
            using var audioConfig = AudioConfig.FromDefaultMicrophoneInput();
            using var recognizer = new SpeechRecognizer(speechConfig, audioConfig);

            //Asks user for mic input and prints transcription result on screen
            Console.WriteLine("Speak into your microphone.");
            var result = await recognizer.RecognizeOnceAsync();
            Console.WriteLine($"RECOGNIZED: Text={result.Text}");
        }
    }

    public class Result
    {
        public class Translated
        {
            public string Text { get; set; }
            public string To { get; set; }
        }
        public List<Translated> translations{ get; set; }

        
    }
}