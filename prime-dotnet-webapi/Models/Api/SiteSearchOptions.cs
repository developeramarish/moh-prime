namespace Prime.Models.Api
{
    public class SiteSearchOptions
    {
        public string TextSearch { get; set; }

        public bool? Approved { get; set; }

        public int? VendorCode { get; set; }

        public int? CareSettingCode { get; set; }
    }
}
