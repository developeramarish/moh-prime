using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Newtonsoft.Json;

namespace Prime.Models
{
    [Table("AdjudicatorNotes")]
    public class AdjudicatorNote : IEnrolleeNote
    {
        [Key]
        public int? Id { get; set; }

        public int EnrolleeId { get; set; }

        [JsonIgnore]
        public Enrollee Enrollee { get; set; }

        [Required]
        public string Note { get; set; }

        [Required]
        public DateTime NoteDate { get; set; }
    }
}