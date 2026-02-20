Scaffold a new REST endpoint with controller, service, and DTO.

Ask the user for:
- Endpoint name (e.g., "AnalysisExport")
- HTTP method and path (e.g., "GET /api/analysis/{id}/export")
- Brief description of what it does

Then create the following files following the project's established patterns:

1. **DTO** at `src/main/java/com/sciome/dto/{Name}Dto.java`:
   - Package: `com.sciome.dto`
   - Simple POJO with fields, getters, setters
   - Follow the pattern in existing DTOs like `ReportDto.java` or `QuestionnaireResponseDto.java`

2. **Service** at `src/main/java/com/sciome/service/{Name}Service.java`:
   - Package: `com.sciome.service`
   - Annotate with `@Service`, `@BrowserCallable`, `@AnonymousAllowed` (if it should be callable from the frontend via Hilla)
   - Inject dependencies via constructor
   - Add SLF4J logger: `private static final Logger log = LoggerFactory.getLogger({Name}Service.class);`
   - Follow the pattern in `QuestionnaireService.java` or `ReportStorageService.java`

3. **Controller** at `src/main/java/com/sciome/controller/{Name}Controller.java`:
   - Package: `com.sciome.controller`
   - Annotate with `@RestController` and `@RequestMapping("/api/{base-path}")`
   - Inject the service via constructor
   - Add SLF4J logger
   - Return `ResponseEntity<>` with appropriate content types and headers
   - Follow the pattern in `ReportExportController.java` or `QuestionnaireExportController.java`

Key conventions:
- Use constructor injection (no `@Autowired`)
- Use `ResponseEntity` for REST responses
- Log at INFO for successful operations, WARN/ERROR for failures
- Wrap risky operations in try/catch returning appropriate HTTP status codes
