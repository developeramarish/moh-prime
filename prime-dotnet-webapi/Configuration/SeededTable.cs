using System;
using System.Collections.Generic;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Prime.Configuration
{
    public abstract class SeededTable<T> : IEntityTypeConfiguration<T> where T : class
    {
        public static readonly DateTime SEEDING_DATE = new DateTime(2019, 9, 16);

        public abstract IEnumerable<T> SeedData { get; }

        public virtual void Configure(EntityTypeBuilder<T> builder)
        {
            builder.HasData(SeedData);
        }
    }
}
