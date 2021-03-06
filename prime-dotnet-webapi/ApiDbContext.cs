using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Prime.Models;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace Prime
{
    // Allow for design time creation of the ApiDbContext
    public class ApiDbContextFactory : IDesignTimeDbContextFactory<ApiDbContext>
    {
        public ApiDbContext CreateDbContext(string[] args)
        {
            // Connect to database
            var connectionString = System.Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
            if (connectionString == null)
            {
                // Build the configuration
                IConfiguration config = new ConfigurationBuilder()
                    .SetBasePath(Directory.GetCurrentDirectory())
                    .AddJsonFile("appsettings.json")
                    .Build();

                connectionString = config.GetConnectionString("PrimeDatabase");
            }

            var optionsBuilder = new DbContextOptionsBuilder<ApiDbContext>();
            optionsBuilder.UseNpgsql(connectionString);
            optionsBuilder.EnableSensitiveDataLogging(sensitiveDataLoggingEnabled: true);

            return new ApiDbContext(optionsBuilder.Options, null);
        }
    }

    public class ApiDbContext : DbContext
    {
        private readonly DateTimeOffset SEEDING_DATE = DateTimeOffset.Now;

        private readonly IHttpContextAccessor _context;

        public ApiDbContext(
            DbContextOptions<ApiDbContext> options,
            IHttpContextAccessor context
            ) : base(options)
        {
            _context = context;
        }

        public DbSet<Certification> Certifications { get; set; }
        public DbSet<Job> Jobs { get; set; }
        public DbSet<EnrolleeCareSetting> EnrolleeCareSettings { get; set; }
        public DbSet<CareSetting> CareSettings { get; set; }
        public DbSet<Enrollee> Enrollees { get; set; }
        public DbSet<Admin> Admins { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<EnrolmentStatus> EnrolmentStatuses { get; set; }
        public DbSet<EnrolmentStatusReason> EnrolmentStatusReasons { get; set; }
        public DbSet<Status> Statuses { get; set; }
        public DbSet<EnrolmentCertificateAccessToken> EnrolmentCertificateAccessTokens { get; set; }
        public DbSet<Privilege> Privileges { get; set; }
        public DbSet<DefaultPrivilege> DefaultPrivileges { get; set; }
        public DbSet<AssignedPrivilege> AssignedPrivileges { get; set; }
        public DbSet<Submission> Submissions { get; set; }
        public DbSet<EnrolleeNote> EnrolleeNotes { get; set; }
        public DbSet<EmailLog> EmailLogs { get; set; }
        public DbSet<SiteRegistrationNote> SiteRegistrationNotes { get; set; }
        public DbSet<AccessAgreementNote> AccessAgreementNotes { get; set; }

        public DbSet<Agreement> Agreements { get; set; }
        public DbSet<AgreementVersion> AgreementVersions { get; set; }
        public DbSet<LimitsConditionsClause> LimitsConditionsClauses { get; set; }

        public DbSet<BusinessEvent> BusinessEvents { get; set; }
        public DbSet<Feedback> Feedback { get; set; }
        public DbSet<EnrolleeRemoteUser> EnrolleeRemoteUsers { get; set; }
        public DbSet<RemoteAccessSite> RemoteAccessSites { get; set; }
        public DbSet<RemoteAccessLocation> RemoteAccessLocations { get; set; }

        // Site Registration
        public DbSet<Organization> Organizations { get; set; }
        public DbSet<Party> Parties { get; set; }
        public DbSet<Site> Sites { get; set; }
        public DbSet<Contact> Contacts { get; set; }
        public DbSet<Vendor> Vendors { get; set; }
        public DbSet<RemoteUser> RemoteUsers { get; set; }
        public DbSet<RemoteUserCertification> RemoteUserCertifications { get; set; }
        public DbSet<EnrolmentStatusReference> EnrolmentStatusReference { get; set; }
        public DbSet<BusinessLicenceDocument> BusinessLicenceDocuments { get; set; }
        public DbSet<SignedAgreementDocument> SignedAgreementDocuments { get; set; }
        public DbSet<SelfDeclaration> SelfDeclarations { get; set; }
        public DbSet<Credential> Credentials { get; set; }

        public DbSet<SelfDeclarationDocument> SelfDeclarationDocuments { get; set; }
        public DbSet<IdentificationDocument> IdentificationDocuments { get; set; }
        public DbSet<EnrolleeAdjudicationDocument> EnrolleeAdjudicationDocuments { get; set; }
        public DbSet<SiteAdjudicationDocument> SiteAdjudicationDocuments { get; set; }
        public DbSet<SiteRegistrationReviewDocument> SiteRegistrationReviewDocuments { get; set; }
        public DbSet<DocumentAccessToken> DocumentAccessToken { get; set; }

        public override int SaveChanges()
        {
            this.ApplyAudits();

            return base.SaveChanges();
        }

        public async override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default(CancellationToken))
        {
            this.ApplyAudits();

            return await base.SaveChangesAsync(cancellationToken);
        }

        private void ApplyAudits()
        {
            ChangeTracker.DetectChanges();

            var created = ChangeTracker.Entries().Where(x => x.State == EntityState.Added);
            var modified = ChangeTracker.Entries().Where(x => x.State == EntityState.Modified);
            var currentUser = _context?.HttpContext?.User.GetPrimeUserId() ?? Guid.Empty;
            var currentDateTime = SEEDING_DATE;

            foreach (var item in created)
            {
                if (item.Entity is IAuditable entity)
                {
                    item.CurrentValues[nameof(IAuditable.CreatedUserId)] = currentUser;
                    item.CurrentValues[nameof(IAuditable.CreatedTimeStamp)] = currentDateTime;
                    item.CurrentValues[nameof(IAuditable.UpdatedUserId)] = currentUser;
                    item.CurrentValues[nameof(IAuditable.UpdatedTimeStamp)] = currentDateTime;
                }
            }

            foreach (var item in modified)
            {
                if (item.Entity is IAuditable entity)
                {
                    item.CurrentValues[nameof(IAuditable.UpdatedUserId)] = currentUser;
                    item.CurrentValues[nameof(IAuditable.UpdatedTimeStamp)] = currentDateTime;
                }
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            #region Discriminators
            modelBuilder.Entity<Address>()
                .HasDiscriminator<AddressType>("AddressType")
                .HasValue<PhysicalAddress>(AddressType.Physical)
                .HasValue<MailingAddress>(AddressType.Mailing);
            #endregion

            #region IAuditable
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(IAuditable).IsAssignableFrom(entityType.ClrType))
                {
                    entityType.FindProperty(nameof(IAuditable.CreatedUserId))
                        .SetAfterSaveBehavior(PropertySaveBehavior.Ignore);

                    entityType.FindProperty(nameof(IAuditable.CreatedTimeStamp))
                        .SetAfterSaveBehavior(PropertySaveBehavior.Ignore);
                }
            }
            #endregion

            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApiDbContext).Assembly);

            #region Indexes
            modelBuilder.Entity<Admin>()
                .HasIndex("UserId")
                .IsUnique();
            #endregion

            #region Relationships
            modelBuilder.Entity<EnrolmentStatus>()
                .HasOne(es => es.Enrollee)
                .WithMany(e => e.EnrolmentStatuses)
                .HasForeignKey(es => es.EnrolleeId);
            modelBuilder.Entity<EnrolmentStatus>()
                .HasOne(es => es.Status)
                .WithMany(s => s.EnrolmentStatuses)
                .HasForeignKey(es => es.StatusCode);

            modelBuilder.Entity<EnrolmentStatusReason>()
                .HasOne(esr => esr.EnrolmentStatus)
                .WithMany(es => es.EnrolmentStatusReasons)
                .HasForeignKey(esr => esr.EnrolmentStatusId);
            modelBuilder.Entity<EnrolmentStatusReason>()
                .HasOne(esr => esr.StatusReason)
                .WithMany(sr => sr.EnrolmentStatusReasons)
                .HasForeignKey(esr => esr.StatusReasonCode);

            modelBuilder.Entity<EnrolleeNote>()
                .HasOne(an => an.Enrollee)
                .WithMany(e => e.AdjudicatorNotes)
                .HasForeignKey(an => an.EnrolleeId);

            modelBuilder.Entity<Agreement>()
                .HasOne(toa => toa.Enrollee)
                .WithMany(e => e.Agreements)
                .HasForeignKey(toa => toa.EnrolleeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Agreement>()
                .HasOne(toa => toa.Organization)
                .WithMany(e => e.Agreements)
                .HasForeignKey(toa => toa.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Agreement>()
                .HasOne(toa => toa.Party)
                .WithMany(e => e.Agreements)
                .HasForeignKey(toa => toa.PartyId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Agreement>()
                .HasCheckConstraint("CHK_Agreement_OnlyOneForeignKey",
                    @"( CASE WHEN ""EnrolleeId"" IS NULL THEN 0 ELSE 1 END
                     + CASE WHEN ""OrganizationId"" IS NULL THEN 0 ELSE 1 END
                     + CASE WHEN ""PartyId"" IS NULL THEN 0 ELSE 1 END) = 1");

            modelBuilder.Entity<BusinessEvent>()
                .HasOne(be => be.BusinessEventType)
                .WithMany(t => t.BusinessEvents)
                .HasForeignKey(be => be.BusinessEventTypeCode);

            // Site Registration
            modelBuilder.Entity<Site>()
                .HasOne(l => l.Organization)
                .WithMany(o => o.Sites)
                .HasForeignKey(l => l.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BusinessLicenceDocument>()
                .HasOne(bl => bl.Site)
                .WithMany(s => s.BusinessLicenceDocuments)
                .HasForeignKey(bl => bl.SiteId);

            modelBuilder.Entity<RemoteUser>()
                .HasOne(ru => ru.Site)
                .WithMany(s => s.RemoteUsers)
                .HasForeignKey(ru => ru.SiteId);

            modelBuilder.Entity<RemoteAccessLocation>()
                .HasOne(ral => ral.Enrollee)
                .WithMany(e => e.RemoteAccessLocations)
                .HasForeignKey(ral => ral.EnrolleeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RemoteAccessSite>()
                .HasOne(ras => ras.Enrollee)
                .WithMany(e => e.RemoteAccessSites)
                .HasForeignKey(ras => ras.EnrolleeId)
                .OnDelete(DeleteBehavior.Cascade);

            #endregion
        }

        // Uncomment for DB logging
        // protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        //     => optionsBuilder.UseLoggerFactory(DbLoggerFactory);

        // public static readonly Microsoft.Extensions.Logging.ILoggerFactory DbLoggerFactory
        //     = new Microsoft.Extensions.Logging.LoggerFactory(new[] { new Microsoft.Extensions.Logging.Debug.DebugLoggerProvider() });
    }
}
