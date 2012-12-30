from django.contrib import admin
from journal.models import Post

class PostAdmin(admin.ModelAdmin):
    fieldsets = [
        ('Post',             {'fields': ['subject', 'title', 'body', 'creator']}),
        ('Times', {'fields': ['created', 'updated'], 'classes': ['collapse']})
    ]
    list_display = ["subject", "title", "body", "creator", "created", "updated"]
    search_fields = ["title"]
    list_filter = ['created']
    date_hierarchy = 'created'

admin.site.register(Post, PostAdmin)

